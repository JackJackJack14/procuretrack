import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          เกิดข้อผิดพลาดในการโหลดหน้านี้
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          กรุณาลองรีเฟรชหรือกลับไปยังหน้าหลัก
        </p>
        {error?.message && (
          <p className="mt-3 text-left text-xs text-destructive/90 rounded-md border border-destructive/20 bg-destructive/5 p-3 break-words">
            {error.message}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            ลองอีกครั้ง
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            กลับหน้าหลัก
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ProcureTrack" },
      { name: "description", content: "ผู้ช่วยงานจัดซื้อจัดจ้างภาครัฐ — จัดเตรียมเอกสารสำหรับการตรวจสอบจากทุกส่วน" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "ProcureTrack" },
      { property: "og:description", content: "ผู้ช่วยงานจัดซื้อจัดจ้างภาครัฐ — จัดเตรียมเอกสารสำหรับการตรวจสอบจากทุกส่วน" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "ProcureTrack" },
      { name: "twitter:description", content: "ผู้ช่วยงานจัดซื้อจัดจ้างภาครัฐ — จัดเตรียมเอกสารสำหรับการตรวจสอบจากทุกส่วน" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/30d34dcc-e15e-486e-84de-743efabc82db/id-preview-079f7017--d0f15734-831a-4465-a90d-45b23a4a8fd5.lovable.app-1779690631991.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/30d34dcc-e15e-486e-84de-743efabc82db/id-preview-079f7017--d0f15734-831a-4465-a90d-45b23a4a8fd5.lovable.app-1779690631991.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
