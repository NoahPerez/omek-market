import tailwindConfig from "../../../../tailwind.config"
import { ArrowRightIcon } from "@/icons"
import Link from "next/link"

type HeroProps = {
  video: string
  poster?: string
  heading: string
  paragraph: string
  buttons: { label: string; path: string }[]
}

export const Hero = ({ video, poster, heading, paragraph, buttons }: HeroProps) => {
  return (
    <section className="w-full container mt-5 text-primary">
      <div className="relative overflow-hidden rounded-sm min-h-[420px] lg:min-h-[560px]">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          aria-label={heading}
        >
          <source src={video} type="video/webm" />
        </video>
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 flex min-h-[420px] lg:min-h-[560px] flex-col justify-end lg:justify-center px-6 py-8 md:px-10 lg:px-16 text-white">
          <div className="max-w-[720px]">
            <h2 className="font-bold mb-4 display-md text-4xl md:text-5xl lg:text-6xl leading-tight">
              {heading}
            </h2>
            <p className="text-base md:text-lg lg:text-xl max-w-[560px] mb-8">
              {paragraph}
            </p>
          </div>
          {buttons.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 font-bold max-w-[520px]">
              {buttons.map(({ label, path }) => (
                <Link
                  key={path}
                  href={path}
                  className="group flex border border-white/60 rounded-sm min-h-[56px] sm:min-h-[64px] w-full bg-white/10 backdrop-blur-[2px] hover:bg-action hover:border-action hover:text-tertiary transition-all duration-300 px-5 py-4 justify-between items-center"
                  aria-label={label}
                  title={label}
                >
                  <span>
                    <span className="group-hover:inline-flex hidden">#</span>
                    {label}
                  </span>

                  <ArrowRightIcon
                    color={tailwindConfig.theme.extend.backgroundColor.primary}
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
