export type ICreateDonationRecord = {
  donationDate: string | Date;
  donationAddress: string;
  rugirDhoron?: string;
  donationSlipNumber?: string;
  slipUrl?: string;
};

export type IDonationRecordFilters = {
  status?: string;
  bloodGroup?: string;
  searchQuery?: string;
  donorId?: string;
};
