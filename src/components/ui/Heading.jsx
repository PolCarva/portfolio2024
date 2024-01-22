import HeadingSVG from "./HeadingSVG";

export default function Heading({ title }) {
  return (
    <>
      <div className="section-heading select-none">
        <div className="heading flex items-center justify-center space-x-[3%]">
          <HeadingSVG />
          <h2 className="w-fit text-5xl sm:text-heading-2 font-extrabold uppercase text-secondary">
            {title}
          </h2>
          <HeadingSVG />
        </div>
      </div>
    </>
  );
}