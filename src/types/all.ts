
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
export type CompanySentimentRow = {
  companyId: string;
  companyName: string;
  time_bucket: Date;
  avgSentiment: number | null;
  movingAvgSentiment:number|null;
};
export type SentimentStat = {
  time_bucket: Date;
  avgSentiment: number;
};
export type GroupedSentimentResponse = {
  companyId: string;
  companyName: string;
  stats: SentimentStat[];
};
  

