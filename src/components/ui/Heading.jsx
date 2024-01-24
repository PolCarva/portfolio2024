import HeadingSVG from "./HeadingSVG";

export default function Heading({ title }) {
  return (
    <>
      <div className="select-none">
        <div className="flex items-center justify-center space-x-[3%]">
          <HeadingSVG />
          <h2 className="w-fit md:text-8xl text-5xl font-extrabold uppercase text-secondary">
            {title}
          </h2>
          <HeadingSVG />
        </div>
      </div>
    </>
  );
}