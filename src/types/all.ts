export interface sentimentTrendAvg  {
  current_month: bigint;
  previous_month: bigint;
  twoMonthsEarlier: bigint;
  threeMonthsEarlier: bigint;
  fourMonthsEarlier: bigint;
  fiveMonthsEarlier: bigint;
};
export interface companyNewsData {
      month:Date,
      articleCount:number
}
