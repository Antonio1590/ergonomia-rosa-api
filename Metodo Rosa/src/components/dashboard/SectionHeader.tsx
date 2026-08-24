type Props = {
  number: number;
  title: string;
  subtitle?: string;
};

export default function SectionHeader({
  number,
  title,
  subtitle,
}: Props) {
  return (
    <div className="flex items-start gap-5 mb-8">

      <div className="w-12 h-12 rounded-2xl bg-[#006D32] text-white flex items-center justify-center font-bold text-lg shadow-lg">
        {number}
      </div>

      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          {title}
        </h2>

        {subtitle && (
          <p className="text-gray-500 mt-2">
            {subtitle}
          </p>
        )}
      </div>

    </div>
  );
}