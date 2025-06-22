import { TaskStatus } from "@/common/enums"
import { useGetTasksQuery } from "@/features/todolists/api/tasksApi"
import type { DomainTodolist } from "@/features/todolists/lib/types"
import List from "@mui/material/List"
import { TaskItem } from "./TaskItem/TaskItem"
import { TasksSkeleton } from "./TasksSkeleton/TasksSkeleton"
import { useState } from "react"
import { TasksPagination } from "@/features/todolists/ui/Todolists/TodolistItem/Tasks/TasksPagination/TasksPagination.tsx"
import { PAGE_SIZE } from "@/common/constants"

type Props = {
  todolist: DomainTodolist
}

export const Tasks = ({ todolist }: Props) => {
  const [page, setPage] = useState(1)

  const { id, filter } = todolist

  const { data, isLoading } = useGetTasksQuery({ todolistId: id, params: { page } })
  // console.log(isLoading, isFetching) // isLoading, isFetching - булеввы значения, isLoading - покажет true только при первом запросе
  // console.log("data", data) //
  // console.log("currentData", currentData) // на время isLoading / isFetching currentData становится undefined,
  // т.е. подразумевается что придут новые данные, старые можно затереть, на время запроса новые данные пока undefined,
  // ну а как запрос отработает то уже currentData станет актуальными данными

  let filteredTasks = data?.items
  if (filter === "active") {
    filteredTasks = filteredTasks?.filter((task) => task.status === TaskStatus.New)
  }
  if (filter === "completed") {
    filteredTasks = filteredTasks?.filter((task) => task.status === TaskStatus.Completed)
  }

  if (isLoading) {
    return <TasksSkeleton />
  }

  return (
    <>
      {filteredTasks?.length === 0 ? (
        <p>Тасок нет</p>
      ) : (
        <>
          <List>{filteredTasks?.map((task) => <TaskItem key={task.id} task={task} todolist={todolist} />)}</List>
          {(data?.totalCount || 0) > PAGE_SIZE && (
            <TasksPagination totalCount={data?.totalCount || 0} page={page} setPage={setPage} />
          )}
        </>
      )}
    </>
  )
}
