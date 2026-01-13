import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Show all files with full details
  const allFiles = await prisma.taskFile.findMany({
    include: { task: true },
  });

  console.log("\n=== ALL FILES ===");
  for (const file of allFiles) {
    console.log(`File ID: ${file.id}`);
    console.log(`  original_name: "${file.original_name}"`);
    console.log(`  file_path: "${file.file_path}"`);
    console.log(`  mime_type: "${file.mime_type}"`);
    console.log(`  task_id: ${file.task_id}, task.title: "${file.task?.title}"`);
    console.log("");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
