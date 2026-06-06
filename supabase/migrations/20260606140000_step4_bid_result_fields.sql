-- ฟิลด์ผลการเสนอราคา (ขั้นตอนที่ 4) — ส่งต่อ winning_bid_amount ไปขั้นตอนทำสัญญา
alter table public.projects
  add column if not exists egp_doc_request_count integer null,
  add column if not exists egp_bid_submission_count integer null,
  add column if not exists winning_bidder_name text null,
  add column if not exists winning_bid_amount numeric null,
  add column if not exists evaluation_report_letter_no text null,
  add column if not exists evaluation_report_approval_date date null;

comment on column public.projects.egp_doc_request_count is 'จำนวนผู้ขอรับ/ซื้อเอกสาร (e-GP) — ขั้นตอนที่ 4';
comment on column public.projects.egp_bid_submission_count is 'จำนวนผู้ยื่นข้อเสนอและราคา — ขั้นตอนที่ 4';
comment on column public.projects.winning_bidder_name is 'ชื่อผู้ชนะการเสนอราคา — ขั้นตอนที่ 4';
comment on column public.projects.winning_bid_amount is 'ราคาที่เสนอชนะ (บาท) — ส่งต่อมูลค่าสัญญา';
comment on column public.projects.evaluation_report_letter_no is 'เลขที่หนังสือรายงานผลการพิจารณา';
comment on column public.projects.evaluation_report_approval_date is 'วันที่หัวหน้าหน่วยงานลงนามอนุมัติรายงานผล';
