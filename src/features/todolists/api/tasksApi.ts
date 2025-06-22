import { baseApi } from "@/app/baseApi"
import { instance } from "@/common/instance"
import type { BaseResponse } from "@/common/types"
import type { DomainTask, GetTasksResponse, UpdateTaskModel } from "./tasksApi.types"
import { PAGE_SIZE } from "@/common/constants"

export const tasksApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTasks: build.query<GetTasksResponse, { todolistId: string; params: { page: number } }>({
      // query: ({ todolistId, params }) => `to-do-lists/${todolistId}/tasks?count=${params.count}&page=${params.page}`, // можно явно задать квери параметры, а передать params
      query: ({ todolistId, params }) => ({
        url: `todo-lists/${todolistId}/tasks`,
        params: { ...params, count: PAGE_SIZE },
      }),
      // providesTags: ["Task"],
      // result в данном случае то, что вернёт данный запрос, т.е. массив тасок
      // arg в данном случае это то что приходит в query зарос, т.е. в данном случае это объект со свойствами todolistId и params
      // error ошибка если будет таковая
      // meta - просто какая-то доп инфа аля какой был метод (гет) и тд там всяких миллион свойств
      // providesTags: (result, _error, {todolistId}, _meta) => {
      //   return result
      //     ? [...result.items.map((task) => ({ type: "Task", id: task.id }) as const), { type: "Task", id: todolistId }]
      //     : [{ type: "Task" }]
      // },
      // тут пример как мы привязались к taskId, но тогда непонятно как быть с addTask, просто достать её с result можно,
      // но работать не будет, можно тогда привязаться к todolistId, но ведь к todolistId можно привязаться и в других запросах,
      // спрашивается а зачем нам тогда вообще в принципе нужны taskId, сразу к todolistId везде и будем привязываться
      //упростили, и вообще result тут не обязательно писать
      providesTags: (_result, _error, { todolistId }, _meta) => [{ type: "Task", id: todolistId }],
      keepUnusedDataFor: 50, // время жизни данных в кэше. Опционален. Если я нахожусь на какой-то странице,
      // отсчёт времени жизни этих данных начинается только при переходе на др страницу, т.е. это было бы глупо, находись я на странице и начни исчезать данные
      // По умолчанию 60сек, мы указали 50. Можно ещё это свойство задать глобально для всего baseApi
    }),
    addTask: build.mutation<BaseResponse<{ item: DomainTask }>, { todolistId: string; title: string }>({
      query: ({ todolistId, title }) => ({
        url: `todo-lists/${todolistId}/tasks`,
        method: "POST",
        body: { title },
      }),
      // invalidatesTags: ["Task"],
      invalidatesTags: (_result, _error, { todolistId }) => [{ type: "Task", id: todolistId }],
    }),
    removeTask: build.mutation<BaseResponse, { todolistId: string; taskId: string }>({
      query: ({ todolistId, taskId }) => ({
        url: `todo-lists/${todolistId}/tasks/${taskId}`,
        method: "DELETE",
      }),
      // invalidatesTags: ["Task"],
      // по аналогии здесь как выше у providesTags, result error arg, где arg - это то что мы передаём аргументами
      // (где taskId деструктуризацией же ещё можем достать todolistId, но он здесь по факту нам не нужен)
      // invalidatesTags: (_result, _error, { taskId }) => [{ type: "Task", id: taskId }],
      invalidatesTags: (_result, _error, { todolistId }) => [{ type: "Task", id: todolistId }],
    }),
    updateTask: build.mutation<
      BaseResponse<{ item: DomainTask }>,
      { todolistId: string; taskId: string; model: UpdateTaskModel }
    >({
      query: ({ todolistId, taskId, model }) => ({
        url: `todo-lists/${todolistId}/tasks/${taskId}`,
        method: "PUT",
        body: model,
      }),
      onQueryStarted: async ({ todolistId, taskId, model }, { dispatch, queryFulfilled, getState }) => {
        const cachedArgsForQuery = tasksApi.util.selectCachedArgsForQuery(getState(), "getTasks")

        let patchResults: any[] = []

        cachedArgsForQuery.forEach((arg) => {
          patchResults.push(
            dispatch(
              tasksApi.util.updateQueryData("getTasks", { todolistId, params: { page: arg.params.page } }, (state) => {
                const index = state.items.findIndex((task) => task.id === taskId)
                if (index !== -1) {
                  state.items[index] = { ...state.items[index], ...model }
                }
              }),
            ),
          )
        })

        const patchResult = dispatch(
          tasksApi.util.updateQueryData("getTasks", { todolistId, params: { page: 1 } }, (state) => {
            // крч тут фишка есть, если { todolistId, params: { page: 1 } } вот это вот не будет соответствовать,
            // в код ниже мы не попадём, типа из-за того что захардкодили страницу 1
            const index = state.items.findIndex((task) => task.id === taskId)
            if (index !== -1) {
              state.items[index] = { ...state.items[index], ...model }
            }
          }),
        )
        try {
          // queryFulfilled вызовет сам запрос, в данном случае removeTodolist
          await queryFulfilled
        } catch (err) {
          patchResults.forEach((patchResult) => {
            patchResult.undo()
          }) // в случае ошибки откатить статус с loading на idle
        }
      },
      // invalidatesTags: ["Task"],
      // invalidatesTags: (_result, _error, { taskId }) => [{ type: "Task", id: taskId }],
      invalidatesTags: (_result, _error, { todolistId }) => [{ type: "Task", id: todolistId }],
    }),
  }),
})

export const { useGetTasksQuery, useAddTaskMutation, useRemoveTaskMutation, useUpdateTaskMutation } = tasksApi

export const _tasksApi = {
  getTasks(todolistId: string) {
    return instance.get<GetTasksResponse>(`/todo-lists/${todolistId}/tasks`)
  },
  createTask(payload: { todolistId: string; title: string }) {
    const { todolistId, title } = payload
    return instance.post<BaseResponse<{ item: DomainTask }>>(`/todo-lists/${todolistId}/tasks`, { title })
  },
  updateTask(payload: { todolistId: string; taskId: string; model: UpdateTaskModel }) {
    const { todolistId, taskId, model } = payload
    return instance.put<BaseResponse<{ item: DomainTask }>>(`/todo-lists/${todolistId}/tasks/${taskId}`, model)
  },
  deleteTask(payload: { todolistId: string; taskId: string }) {
    const { todolistId, taskId } = payload
    return instance.delete<BaseResponse>(`/todo-lists/${todolistId}/tasks/${taskId}`)
  },
}
