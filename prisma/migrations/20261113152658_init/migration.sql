-- CreateEnum
CREATE TYPE "Soort" AS ENUM ('DEFECT', 'TAAK');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('G', 'NG');

-- CreateEnum
CREATE TYPE "Controle" AS ENUM ('OK', 'NOK');

-- CreateEnum
CREATE TYPE "MailType" AS ENUM ('NIEUWE_AANVRAAG', 'ONTVANGST', 'STATUS_G', 'STATUS_NG');

-- CreateEnum
CREATE TYPE "MailStatus" AS ENUM ('VERSTUURD', 'MISLUKT', 'TEST');

-- CreateTable
CREATE TABLE "Aanvraag" (
    "id" TEXT NOT NULL,
    "volgnummer" TEXT NOT NULL,
    "ingediendOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "naam" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "soort" "Soort" NOT NULL,
    "campus" TEXT NOT NULL,
    "locatie" TEXT NOT NULL,
    "beschrijving" TEXT NOT NULL,
    "status" "Status",
    "ngReden" TEXT,
    "prioriteit" INTEGER,
    "klusjesmanId" TEXT,
    "controle" "Controle",
    "controleDatum" TIMESTAMP(3),
    "interneOpmerking" TEXT,

    CONSTRAINT "Aanvraag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Foto" (
    "id" TEXT NOT NULL,
    "aanvraagId" TEXT NOT NULL,
    "pad" TEXT NOT NULL,
    "miniatuur" TEXT NOT NULL,
    "bestandsnaam" TEXT NOT NULL,
    "grootte" INTEGER NOT NULL,
    "volgorde" INTEGER NOT NULL DEFAULT 0,
    "aangemaakt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Foto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Klusjesman" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "actief" BOOLEAN NOT NULL DEFAULT true,
    "aangemaakt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Klusjesman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Historiek" (
    "id" TEXT NOT NULL,
    "aanvraagId" TEXT NOT NULL,
    "tijdstip" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "door" TEXT NOT NULL,
    "veld" TEXT NOT NULL,
    "oudeWaarde" TEXT,
    "nieuweWaarde" TEXT,

    CONSTRAINT "Historiek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mail" (
    "id" TEXT NOT NULL,
    "aanvraagId" TEXT,
    "type" "MailType" NOT NULL,
    "aan" TEXT NOT NULL,
    "onderwerp" TEXT NOT NULL,
    "inhoud" TEXT NOT NULL,
    "status" "MailStatus" NOT NULL,
    "fout" TEXT,
    "pogingen" INTEGER NOT NULL DEFAULT 1,
    "aangemaakt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verstuurdOp" TIMESTAMP(3),

    CONSTRAINT "Mail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teller" (
    "jaar" INTEGER NOT NULL,
    "laatste" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Teller_pkey" PRIMARY KEY ("jaar")
);

-- CreateTable
CREATE TABLE "Inzending" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "tijdstip" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inzending_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Aanvraag_volgnummer_key" ON "Aanvraag"("volgnummer");

-- CreateIndex
CREATE INDEX "Aanvraag_controle_idx" ON "Aanvraag"("controle");

-- CreateIndex
CREATE INDEX "Aanvraag_status_idx" ON "Aanvraag"("status");

-- CreateIndex
CREATE INDEX "Aanvraag_controleDatum_idx" ON "Aanvraag"("controleDatum");

-- CreateIndex
CREATE INDEX "Historiek_aanvraagId_idx" ON "Historiek"("aanvraagId");

-- CreateIndex
CREATE INDEX "Mail_aanvraagId_idx" ON "Mail"("aanvraagId");

-- CreateIndex
CREATE INDEX "Inzending_ipHash_tijdstip_idx" ON "Inzending"("ipHash", "tijdstip");

-- AddForeignKey
ALTER TABLE "Aanvraag" ADD CONSTRAINT "Aanvraag_klusjesmanId_fkey" FOREIGN KEY ("klusjesmanId") REFERENCES "Klusjesman"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_aanvraagId_fkey" FOREIGN KEY ("aanvraagId") REFERENCES "Aanvraag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Historiek" ADD CONSTRAINT "Historiek_aanvraagId_fkey" FOREIGN KEY ("aanvraagId") REFERENCES "Aanvraag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mail" ADD CONSTRAINT "Mail_aanvraagId_fkey" FOREIGN KEY ("aanvraagId") REFERENCES "Aanvraag"("id") ON DELETE SET NULL ON UPDATE CASCADE;
