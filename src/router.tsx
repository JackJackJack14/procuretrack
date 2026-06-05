import { QueryClient } from "@tanstack/react-query";
import { createRouter, Link } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function DefaultNotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">ไม่พบหน้าที่คุณต้องการ</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          หน้าที่คุณค้นหาไม่มีอยู่หรือถูกย้ายแล้ว
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,      // cache 5 นาที
        gcTime: 1000 * 60 * 10,        // เก็บใน memory 10 นาที
        refetchOnWindowFocus: false,    // ไม่ fetch ใหม่เมื่อ focus window
        refetchOnMount: false,          // ไม่ fetch ใหม่เมื่อ mount ซ้ำ
        retry: 1,                       // retry แค่ 1 ครั้งถ้า error
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: DefaultNotFoundComponent,
  });

  return router;
};
