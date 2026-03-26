import { Header } from "@/features/form/components/common/header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col ">
      <Header />
      <div className="w-full flex-1">
        <div>{children}</div>
      </div>
    </div>
  );
}
