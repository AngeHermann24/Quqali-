import { ProChrome } from "@/components/pro/pro-chrome";

export default function ProLayout({ children }: LayoutProps<"/pro">) {
  return <ProChrome>{children}</ProChrome>;
}
