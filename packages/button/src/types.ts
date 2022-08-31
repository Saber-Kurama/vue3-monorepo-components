export type RequestFn = (query: any) => Promise<{
  data: any[];
  success: boolean;
  total: number;
}>;
export interface Saber {
  name: string;
}
