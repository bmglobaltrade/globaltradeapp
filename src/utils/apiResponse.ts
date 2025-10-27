export interface ApiResponse<T>
{ success:boolean,
  message:string,
  data?:T,
}
export const successResponse=<T>(data:T,msg?:string):ApiResponse<T>=>
({
    success:true,
    message:msg?msg:"Request successful",
    data:data
})
