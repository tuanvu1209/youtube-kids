/**
 * Dữ liệu mẫu để demo. Chạy: npm run db:seed
 *
 * Video được lấy thật từ YouTube:
 *  - Có YOUTUBE_API_KEY  -> tìm bằng Data API (safeSearch=strict) theo từng chủ đề.
 *  - Không có key        -> dùng danh sách ID dự phòng, xác minh qua oEmbed và chỉ giữ lại
 *                           video thuộc các kênh thiếu nhi quen thuộc.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";
import { fetchVideoMeta, searchVideos, type VideoMeta } from "../src/lib/youtube";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const TRUSTED_CHANNEL_HINTS = [
  "pinkfong",
  "super simple",
  "cocomelon",
  "chuchu",
  "babybus",
  "little baby bum",
  "sesame",
  "peppa",
  "blippi",
  "scishow kids",
  "national geographic kids",
  "kids learning tube",
  "nhac thieu nhi",
  "nhạc thiếu nhi",
  "bibabibo",
  "kids tv",
];

const FALLBACK_IDS = [
  "XqZsoesa55w", // Baby Shark Dance
  "yCjJyiqpAuU", // Baby Shark & bạn bè
  "e_04ZrNroTo",
  "hq3yfQnllfQ",
  "tVlcKp3bWH8",
  "D1CkD3jTt1c",
  "hDMHtcYzs4E",
  "cJ9To6EtsOg",
];

type Topic = { query: string; emoji: string; title: string; description: string; ageGroup: string };

const TOPICS: Topic[] = [
  {
    query: "bài hát thiếu nhi tiếng Việt cho bé",
    emoji: "🎵",
    title: "Nhạc thiếu nhi Việt Nam",
    description: "Những bài hát quen thuộc, giai điệu vui, không quảng cáo giữa chừng.",
    ageGroup: "3-5",
  },
  {
    query: "abc song for kids super simple songs",
    emoji: "🔤",
    title: "Học tiếng Anh vỡ lòng",
    description: "Bảng chữ cái, số đếm, màu sắc bằng tiếng Anh cho bé mẫu giáo.",
    ageGroup: "3-5",
  },
  {
    query: "science experiments for kids scishow kids",
    emoji: "🧪",
    title: "Khoa học vui cho bé tiểu học",
    description: "Thí nghiệm đơn giản, giải thích hiện tượng quanh nhà.",
    ageGroup: "6-8",
  },
];

function isTrusted(meta: VideoMeta) {
  const channel = meta.channelTitle.toLowerCase();
  return TRUSTED_CHANNEL_HINTS.some((hint) => channel.includes(hint));
}

async function collectVideos(topic: Topic, limit: number): Promise<VideoMeta[]> {
  if (process.env.YOUTUBE_API_KEY) {
    try {
      const found = await searchVideos(topic.query, limit);
      if (found.length > 0) return found.slice(0, limit);
    } catch (error) {
      console.warn(`  ! Data API lỗi (${(error as Error).message}), chuyển sang danh sách dự phòng`);
    }
  }

  const collected: VideoMeta[] = [];
  for (const id of FALLBACK_IDS) {
    if (collected.length >= limit) break;
    const meta = await fetchVideoMeta(id);
    if (meta && isTrusted(meta)) collected.push(meta);
  }
  return collected;
}

async function main() {
  console.log("→ Xoá dữ liệu cũ…");
  await prisma.watchEvent.deleteMany();
  await prisma.report.deleteMany();
  await prisma.playlistLike.deleteMany();
  await prisma.kidPlaylist.deleteMany();
  await prisma.playlistItem.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.video.deleteMany();
  await prisma.kid.deleteMany();
  await prisma.parent.deleteMany();

  const demo = await prisma.parent.create({
    data: {
      email: "demo@kidtube.vn",
      name: "Mẹ Bống",
      passwordHash: hashPassword("123456"),
      pin: "1234",
      kids: {
        create: [
          { name: "Bống", avatar: "🐻", ageGroup: "3-5", dailyLimitMin: 30 },
          { name: "Bin", avatar: "🦊", ageGroup: "6-8", dailyLimitMin: 45 },
        ],
      },
    },
    include: { kids: true },
  });

  const neighbour = await prisma.parent.create({
    data: {
      email: "hangxom@kidtube.vn",
      name: "Bố Tít",
      passwordHash: hashPassword("123456"),
      pin: "4321",
    },
  });

  console.log("→ Lấy video thật từ YouTube…");
  let created = 0;

  for (const [index, topic] of TOPICS.entries()) {
    const videos = await collectVideos(topic, 6);
    if (videos.length === 0) {
      console.warn(`  ! Bỏ qua "${topic.title}" — không lấy được video nào`);
      continue;
    }

    // Playlist đầu thuộc tài khoản demo, các playlist sau thuộc "hàng xóm" để có dữ liệu cộng đồng.
    const owner = index === 0 ? demo : neighbour;
    const playlist = await prisma.playlist.create({
      data: {
        ownerId: owner.id,
        title: topic.title,
        description: topic.description,
        emoji: topic.emoji,
        ageGroup: topic.ageGroup,
        isPublic: true,
        copyCount: index * 3,
      },
    });

    for (const [position, meta] of videos.entries()) {
      const video = await prisma.video.upsert({
        where: { youtubeId: meta.youtubeId },
        update: {},
        create: meta,
      });
      await prisma.playlistItem.upsert({
        where: { playlistId_videoId: { playlistId: playlist.id, videoId: video.id } },
        update: {},
        create: { playlistId: playlist.id, videoId: video.id, position },
      });
      created += 1;
    }

    // Gán playlist đúng nhóm tuổi cho bé của tài khoản demo.
    const kid = demo.kids.find((k) => k.ageGroup === topic.ageGroup);
    if (kid) {
      await prisma.kidPlaylist.upsert({
        where: { kidId_playlistId: { kidId: kid.id, playlistId: playlist.id } },
        update: {},
        create: { kidId: kid.id, playlistId: playlist.id },
      });
    }

    if (owner.id === neighbour.id) {
      await prisma.playlistLike.create({
        data: { parentId: demo.id, playlistId: playlist.id },
      });
    }

    console.log(`  ✓ ${topic.title}: ${videos.length} video`);
  }

  console.log(`\nXong! ${created} video đã được duyệt.`);
  console.log("Tài khoản demo: demo@kidtube.vn / 123456 (PIN 1234)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
