import { containerSx } from "@/common/styles"
import { useGetTodolistsQuery } from "@/features/todolists/api/todolistsApi"
import Box from "@mui/material/Box"
import { TodolistSkeleton } from "./TodolistSkeleton/TodolistSkeleton"
import Grid from "@mui/material/Grid2"
import Paper from "@mui/material/Paper"
import { TodolistItem } from "./TodolistItem/TodolistItem"

export const Todolists = () => {
  const { data: todolists, isLoading } = useGetTodolistsQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    // pollingInterval: 3000, // Опционально. Каждые три секунды делать запрос за тудулистами
    // skipPollingIfUnfocused: true, // а вот если я ухожу с этой вкладки, тогда запросы не делай, когда вернусь, делай
  })
  // параметры никакие не передаём, поэтому поставили undefined, чтобы вторым указать уже специальный опциональный
  // объект со свойством refetchOnFocus, refetchOnReconnect и тд там много. Что за они смотри baseApi

  if (isLoading) {
    return (
      <Box sx={containerSx} style={{ gap: "32px" }}>
        {Array(3)
          .fill(null)
          .map((_, id) => (
            <TodolistSkeleton key={id} />
          ))}
      </Box>
    )
  }

  return (
    <>
      {todolists?.map((todolist) => (
        <Grid key={todolist.id}>
          <Paper sx={{ p: "0 20px 20px 20px" }}>
            <TodolistItem todolist={todolist} />
          </Paper>
        </Grid>
      ))}
    </>
  )
}
