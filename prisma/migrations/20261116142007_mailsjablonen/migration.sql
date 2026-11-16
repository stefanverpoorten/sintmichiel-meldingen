-- CreateTable
CREATE TABLE "MailSjabloon" (
    "type" "MailType" NOT NULL,
    "onderwerp" TEXT NOT NULL,
    "inhoud" TEXT NOT NULL,
    "gewijzigdOp" TIMESTAMP(3) NOT NULL,
    "gewijzigdDoor" TEXT,

    CONSTRAINT "MailSjabloon_pkey" PRIMARY KEY ("type")
);
