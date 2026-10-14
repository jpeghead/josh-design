import { Container, Arrow } from "@/components/ui";

export default function NotFound() {
  return (
    <Container>
      <section className="pb-28 pt-40 sm:pt-56">
        <p className="text-sm font-medium text-fg-2">404</p>
        <h1 className="serif mt-3 text-[3rem] leading-[1.02] sm:text-[4.5rem]">That page isn&rsquo;t here.</h1>
        <p className="mt-6 max-w-xl text-xl leading-snug text-fg-2">Either the link is broken or the page lives somewhere else now.</p>
        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          <Arrow href="/">Home</Arrow>
          <Arrow href="/work" className="text-fg-2">
            Work
          </Arrow>
        </div>
      </section>
    </Container>
  );
}
