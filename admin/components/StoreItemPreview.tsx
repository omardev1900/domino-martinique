import React from 'react';

type ItemType = 'SKIN' | 'AVATAR' | 'CURRENCY_PACK';

type SkinConfig = {
  tableBackgroundColor: string;
  boardColor?: string;
  dominoBackgroundColor: string;
  dominoDotColor: string;
  dominoLineColor: string;
};

type StoreItemPreviewItem = {
  id?: string;
  name?: string;
  type?: ItemType;
  assetId?: string;
  imageUrl?: string;
  rewards?: { coins?: number; diamonds?: number };
  skinConfig?: Partial<SkinConfig>;
};

type StoreItemPreviewProps = {
  item: StoreItemPreviewItem;
  previewUrl?: string | null;
  heightClassName?: string;
};

const DEFAULT_SKIN: SkinConfig = {
  tableBackgroundColor: '#105B3A',
  boardColor: '#1B5E20',
  dominoBackgroundColor: '#FFFFFF',
  dominoDotColor: '#000000',
  dominoLineColor: '#000000',
};

function Pip({ color }: { color: string }) {
  return <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />;
}

function DominoHalf({ color, value }: { color: string; value: 0 | 5 }) {
  if (value === 0) {
    return <div className="relative flex-1" />;
  }

  return (
    <div className="relative flex-1">
      <div className="absolute left-[22%] top-[18%]"><Pip color={color} /></div>
      <div className="absolute right-[22%] top-[18%]"><Pip color={color} /></div>
      <div className="absolute left-1/2 top-1/2 -ml-1 -mt-1"><Pip color={color} /></div>
      <div className="absolute bottom-[18%] left-[22%]"><Pip color={color} /></div>
      <div className="absolute bottom-[18%] right-[22%]"><Pip color={color} /></div>
    </div>
  );
}

function SingleDominoPreview({ skin }: { skin: SkinConfig }) {
  return (
    <div
      className="flex aspect-[2/1] w-[74%] max-w-[132px] items-stretch justify-center rounded-[4px]"
      style={{ backgroundColor: skin.dominoBackgroundColor }}
    >
      <DominoHalf color={skin.dominoDotColor} value={5} />
      <div className="my-1.5 w-[2px]" style={{ backgroundColor: skin.dominoLineColor }} />
      <DominoHalf color={skin.dominoDotColor} value={0} />
    </div>
  );
}

export function StoreItemPreview({ item, previewUrl, heightClassName = 'h-28' }: StoreItemPreviewProps) {
  const type = item.type ?? 'AVATAR';
  const imageSource = previewUrl || item.imageUrl;
  const skin = { ...DEFAULT_SKIN, ...(item.skinConfig ?? {}) };

  if (type === 'AVATAR') {
    return (
      <div className={`overflow-hidden rounded-xl border border-gray-700 bg-gray-800 ${heightClassName}`}>
        {imageSource ? (
          <img src={imageSource} alt={item.id || 'avatar'} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-white/5 px-2 text-gray-400">
            <span className="text-3xl">A</span>
            <span className="text-center text-[11px] font-semibold leading-tight">{item.name || item.assetId || 'Avatar'}</span>
          </div>
        )}
      </div>
    );
  }

  if (type === 'SKIN') {
    return (
      <div
        className={`overflow-hidden rounded-xl border border-gray-700 p-0.5 ${heightClassName}`}
        style={{ backgroundColor: skin.tableBackgroundColor }}
      >
        <div
          className="flex h-full items-center justify-center px-1"
          style={{ backgroundColor: skin.boardColor ?? skin.tableBackgroundColor }}
        >
          <SingleDominoPreview skin={skin} />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border border-gray-700 bg-gray-800 ${heightClassName}`}>
      {imageSource ? (
        <img src={imageSource} alt={item.id || 'pack'} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-3xl text-gray-500">D</div>
      )}
      {item.rewards?.coins ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-black text-yellow-300 [text-shadow:0_2px_8px_rgba(0,0,0,0.85)]">
            {item.rewards.coins.toLocaleString('fr-FR')}
          </span>
        </div>
      ) : null}
    </div>
  );
}
