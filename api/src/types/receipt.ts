export type Receipt = {
  id: string;
  user_id: string;
  image_url: string | null;
  ocr_raw_text: string;
  extracted_amount: number | null;
  extracted_merchant: string | null;
  extracted_date: string | null;
  linked_transaction_id: string | null;
  created_at: string;
  updated_at: string;
};
