-- CreateEnum
CREATE TYPE "LinnkerLinkType" AS ENUM ('TRACKING', 'FORM', 'CHAT', 'EXTERNAL', 'AGENDA');

-- CreateTable
CREATE TABLE "linnker_pages" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bio" TEXT,
    "avatar_url" TEXT,
    "cover_color" TEXT NOT NULL DEFAULT '#6366f1',
    "button_style" TEXT NOT NULL DEFAULT 'rounded',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linnker_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linnker_links" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "type" "LinnkerLinkType" NOT NULL DEFAULT 'EXTERNAL',
    "icon" TEXT,
    "emoji" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linnker_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linnker_scans" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "linnker_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "linnker_pages_slug_key" ON "linnker_pages"("slug");

-- CreateIndex
CREATE INDEX "linnker_pages_organization_id_idx" ON "linnker_pages"("organization_id");

-- CreateIndex
CREATE INDEX "linnker_links_page_id_idx" ON "linnker_links"("page_id");

-- CreateIndex
CREATE INDEX "linnker_scans_page_id_idx" ON "linnker_scans"("page_id");

-- AddForeignKey
ALTER TABLE "linnker_pages" ADD CONSTRAINT "linnker_pages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linnker_pages" ADD CONSTRAINT "linnker_pages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linnker_links" ADD CONSTRAINT "linnker_links_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "linnker_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linnker_scans" ADD CONSTRAINT "linnker_scans_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "linnker_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linnker_scans" ADD CONSTRAINT "linnker_scans_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
