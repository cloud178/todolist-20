import { baseApi } from "@/app/baseApi"
import { instance } from "@/common/instance"
import type { BaseResponse } from "@/common/types"
import type { DomainTodolist } from "@/features/todolists/lib/types"
import type { Todolist } from "./todolistsApi.types"

export const todolistsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTodolists: build.query<DomainTodolist[], void>({
      query: () => "todo-lists",
      transformResponse: (todolists: Todolist[]): DomainTodolist[] =>
        todolists.map((todolist) => ({ ...todolist, filter: "all", entityStatus: "idle" })),
      providesTags: ["Todolist"],
    }),
    addTodolist: build.mutation<BaseResponse<{ item: Todolist }>, string>({
      query: (title) => ({
        url: "todo-lists",
        method: "POST",
        body: { title },
      }),
      invalidatesTags: ["Todolist"],
    }),
    removeTodolist: build.mutation<BaseResponse, string>({
      query: (id) => ({
        url: `todo-lists/${id}`,
        method: "DELETE",
      }),
      // onQueryStarted, пример optimistic update - до того как попадём в removeTodolist, попадаем в onQueryStarted,
      // и здесь дизейблим кнопку удаления тудулиста либо сразу чего мелочиться, удалим тудулист.
      // Ранее эта логика как мы перешли со слайсов на ртк квери в todolistTitle, можешь посмотреть прошлый архив, сейчас же вынесли её таким образом сюда
      invalidatesTags: ["Todolist"],
      onQueryStarted: async (todolistId, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          todolistsApi.util.updateQueryData("getTodolists", undefined, (state) => {
            // const todolist = state.find((todolist) => todolist.id === todolistId)
            // if (todolist) {
            //   todolist.entityStatus = "loading"
            // }
            const index = state.findIndex((todo) => todo.id === todolistId)
            if (index !== -1) {
              state.splice(index, 1)
            }
          }),
        )
        try {
          // queryFulfilled вызовет сам запрос, в данном случае removeTodolist
          await queryFulfilled
        } catch (err) {
          patchResult.undo() // в случае ошибки откатить статус с loading на idle
        }
      },
    }),
    updateTodolistTitle: build.mutation<BaseResponse, { id: string; title: string }>({
      query: ({ id, title }) => ({
        url: `todo-lists/${id}`,
        method: "PUT",
        body: { title },
      }),
      invalidatesTags: ["Todolist"],
    }),
  }),
})

export const {
  useGetTodolistsQuery,
  useAddTodolistMutation,
  useRemoveTodolistMutation,
  useUpdateTodolistTitleMutation,
} = todolistsApi

export const _todolistsApi = {
  getTodolists() {
    return instance.get<Todolist[]>("/todo-lists")
  },
  changeTodolistTitle(payload: { id: string; title: string }) {
    const { id, title } = payload
    return instance.put<BaseResponse>(`/todo-lists/${id}`, { title })
  },
  createTodolist(title: string) {
    return instance.post<BaseResponse<{ item: Todolist }>>("/todo-lists", { title })
  },
  deleteTodolist(id: string) {
    return instance.delete<BaseResponse>(`/todo-lists/${id}`)
  },
}
