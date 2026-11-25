-- Nieuwe soort "Gevaarlijke situatie" en de vraag "Is er direct gevaar?"
ALTER TYPE "Soort" ADD VALUE 'GEVAARLIJK';

ALTER TABLE "Aanvraag" ADD COLUMN "directGevaar" BOOLEAN;
