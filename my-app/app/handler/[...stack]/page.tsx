import { StackHandler } from "@stackframe/stack";

export default function Handler() {
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <main className="flex flex-1 items-start justify-center p-6 py-16">
        <StackHandler fullPage={false} />
      </main>
    </div>
  );
}
