-- DropIndex
DROP INDEX "Aanvraag_controleDatum_idx";

-- DropIndex
DROP INDEX "Aanvraag_controle_idx";

-- DropIndex
DROP INDEX "Aanvraag_status_idx";

-- DropIndex
DROP INDEX "Historiek_aanvraagId_idx";

-- DropIndex
DROP INDEX "Mail_aanvraagId_idx";

-- CreateIndex
CREATE INDEX "Aanvraag_status_controle_ingediendOp_idx" ON "Aanvraag"("status", "controle", "ingediendOp");

-- CreateIndex
CREATE INDEX "Aanvraag_controle_controleDatum_idx" ON "Aanvraag"("controle", "controleDatum");

-- CreateIndex
CREATE INDEX "Aanvraag_ingediendOp_idx" ON "Aanvraag"("ingediendOp");

-- CreateIndex
CREATE INDEX "Aanvraag_klusjesmanId_status_controle_idx" ON "Aanvraag"("klusjesmanId", "status", "controle");

-- CreateIndex
CREATE INDEX "Aanvraag_campus_idx" ON "Aanvraag"("campus");

-- CreateIndex
CREATE INDEX "Aanvraag_soort_idx" ON "Aanvraag"("soort");

-- CreateIndex
CREATE INDEX "Aanvraag_prioriteit_idx" ON "Aanvraag"("prioriteit");

-- CreateIndex
CREATE INDEX "Foto_aanvraagId_volgorde_idx" ON "Foto"("aanvraagId", "volgorde");

-- CreateIndex
CREATE INDEX "Historiek_aanvraagId_tijdstip_idx" ON "Historiek"("aanvraagId", "tijdstip");

-- CreateIndex
CREATE INDEX "Inzending_tijdstip_idx" ON "Inzending"("tijdstip");

-- CreateIndex
CREATE INDEX "Klusjesman_actief_naam_idx" ON "Klusjesman"("actief", "naam");

-- CreateIndex
CREATE INDEX "Mail_aanvraagId_type_aangemaakt_idx" ON "Mail"("aanvraagId", "type", "aangemaakt");

-- CreateIndex
CREATE INDEX "Mail_aangemaakt_idx" ON "Mail"("aangemaakt");

-- CreateIndex
CREATE INDEX "Mail_status_aangemaakt_idx" ON "Mail"("status", "aangemaakt");
