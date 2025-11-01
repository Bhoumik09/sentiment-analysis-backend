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
export interface NewsPaginatedDataType{

      id:string
      title:string
      content:string
      publishedAt:Date
      url:string 
      ArticlesSentiment: 
        {
          id: string,
          sentiment:string,
          sentimentScore: number,
          Startups: {
            id: string,
            name:string,
            sector: {
              name:string
            }
          }
        }[]
      
    }
  

