import Header from "@/components/app/header/header";
import Sidebar from "@/components/app/header/sidebar";
import { getUser } from "@/lib/dal";

const AppLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const user = await getUser();
  return (
    <div className="flex">
      <Sidebar user={user} />
      <div className="w-full">
        <Header user={user} />
        <div className="h-[calc(100svh-56px)] md:h-[calc(100svh-76px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
