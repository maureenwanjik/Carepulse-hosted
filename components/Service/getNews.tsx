import axios from "axios"

export function getNews(category ='Health', country='us') {
    const API_Key =  process.env.NEXT_PUBLIC_API_KEY2!
    const API_Endpoint = `https://newsapi.org/v2/everything?q=${category}&language=en&sortBy=publishedAt`

   return axios.get(`${API_Endpoint}&apiKey=${API_Key}`)

    
}
//https://newsapi.org/v2/top-headlines?country=us&category=health&apiKey=87af4062673b495b9920eb0543a8a95e

//https://newsapi.org/v2/top-headlines/sources?category=health&apiKey=87af4062673b495b9920eb0543a8a95e

//https://newsdata.io/api/1/archive?apikey=pub_507972c9bca8c02d3278ccacd75424e99bd2e&q=example&language=en&from_date=2023-01-19&to_date=2023-01-25

//https://newsdata.io/api/1/sources?apikey=pub_507972c9bca8c02d3278ccacd75424e99bd2e