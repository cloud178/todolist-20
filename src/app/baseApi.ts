import { AUTH_TOKEN } from "@/common/constants"
import { handleError } from "@/common/utils"
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

export const baseApi = createApi({
  reducerPath: "todolistsApi",
  tagTypes: ["Todolist", "Task"],
  baseQuery: async (args, api, extraOptions) => {
    const result = await fetchBaseQuery({
      baseUrl: import.meta.env.VITE_BASE_URL,
      prepareHeaders: (headers) => {
        headers.set("API-KEY", import.meta.env.VITE_API_KEY)
        headers.set("Authorization", `Bearer ${localStorage.getItem(AUTH_TOKEN)}`)
      },
    })(args, api, extraOptions)

    handleError(api, result)

    return result
  },
  endpoints: () => ({}),
  // keepUnusedDataFor: 50 - время жизни кэша для всего baseApi. Опционален. По-умолчанию 60сек.
  // Можно задавать для кокретных запросов как в getTasks
  // refetchOnFocus: true, // Опциональное свойство. Зачем нужно - открыты например две вкладки тудулистов,
  // на одной вкладке создали тудулист, он отобразился, на второй же вкладке без этого свойтсва не отобразится автоматически.
  // НО, полетят все запросы на этой второй вкладке когда мы на неё перейдём. Можно сделать для частных каких-то запросов,
  // например только для тех же тудулистов, но, не в todolistApi, а в хук закинуть, смотри в Todolists.
  // Теперь если добавили тудулист на одной вкладке, при переключении на вторую тудулист автоматически запросится, а те же таски нет
  // refetchOnReconnect: true, // если например оборвалось интернет-соединение,
  // при его восстановлении автоматически полетят снова все запросы, как будто бы мы нажали ctrl + R
  // Можно сделать для частных каких-то запросов,
  // например только для тех же тудулистов, но, не в todolistApi, а в хук закинуть, смотри в Todolists.
})
