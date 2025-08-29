import React from 'react';

interface InfoItem {
  title: string;
  desc?: string;
}

interface InfoBoxProps {
  title: string;
  items: InfoItem[];
  className?: string;
}

const InfoBox: React.FC<InfoBoxProps> = ({ title, items, className = '' }) => {
  return (
    <div className={`bg-gradient-to-br from-brand-50 to-brand-100 rounded-2xl p-6 border-2 border-brand-200/50 ${className}`}>
      <h3 className="font-medium text-lg text-orange-600 mb-4">
        {title}
      </h3>
      <div className="grid gap-3">
        {items.map((item, idx) => (
          <div key={idx}>
            <p className="text-gray-900 font-medium">{item.title}</p>
            {item.desc && (
              <p className="text-sm text-gray-600">{item.desc}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfoBox;