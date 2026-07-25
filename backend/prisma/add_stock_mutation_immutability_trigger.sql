-- Trigger: cegah UPDATE dan DELETE pada stock_mutations
CREATE OR REPLACE FUNCTION prevent_stock_mutation_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'stock_mutations is immutable. Operation % is not allowed.', TG_OP;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stock_mutations_immutable ON stock_mutations;
CREATE TRIGGER trg_stock_mutations_immutable
  BEFORE UPDATE OR DELETE ON stock_mutations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_stock_mutation_mutation();

-- Index untuk FEFO query
CREATE INDEX IF NOT EXISTS idx_product_batches_fefo
  ON product_batches (product_id, expired_date, created_at)
  WHERE current_stock_base > 0 AND is_active = TRUE AND deleted_at IS NULL;
