import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/stack";

export default function Handler(props: any) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9f9f9", // optional
      }}
    >
      <StackHandler app={stackServerApp} routeProps={props} fullPage={false} />
    </div>
  );
}
