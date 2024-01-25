import HeadingSVG from "./HeadingSVG";

export default function Heading({ title }) {
  return (
    <>
      <div className="select-none pt-5 overflow-hidden heading">
        <div className="heading-container flex items-center justify-center space-x-[3%] heading-item">
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