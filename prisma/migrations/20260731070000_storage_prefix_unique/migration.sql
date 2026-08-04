-- Make the creative storage prefix actually unique.
--
-- The previous migration backfilled {workspace}/{userId}/{unix seconds}, which
-- is NOT unique: concepts within one run render concurrently and land in the
-- same second. On real data that produced 82 distinct prefixes for 85
-- creatives — three sets of renders would have overwritten each other in R2.
-- conceptIndex is no fix: two of the three collisions were different runs that
-- shared conceptIndex 0. Only the creative id is unique.
--
-- Safe to run before any object has moved to R2: nothing is addressed by the
-- old prefix yet, so this is a pure rename.

UPDATE "creatives"
   SET "storagePrefix" = "storagePrefix" || '-' || substr(id, 1, 8)
 WHERE "storagePrefix" IS NOT NULL;

-- Belt and braces: the suffix makes collisions vanishingly unlikely, the index
-- makes them impossible. A future regression fails loudly at INSERT instead of
-- silently overwriting somebody's renders.
CREATE UNIQUE INDEX "creatives_storagePrefix_key" ON "creatives"("storagePrefix");
