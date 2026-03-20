interface ProposalGalleryProps {
  gallery: any[];
}

export default function ProposalGallery({ gallery }: ProposalGalleryProps) {
  if (gallery.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold text-[#2c3e50] mb-6 border-b border-[#ecf0f1] pb-2">Gallery</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {gallery.map(img => (
          <div key={img.id} className="bg-white rounded-lg overflow-hidden border border-[#ecf0f1] shadow-sm">
            <img
              src={img.image_url}
              alt={img.caption || ''}
              className="w-full h-48 object-cover"
              loading="lazy"
            />
            {img.caption && (
              <p className="p-3 text-sm text-[#7f8c8d]">{img.caption}</p>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-[#95a5a6] mt-4 italic">
        These mockups are references for creative direction. The final design is rebuilt and realized for production.
      </p>
    </section>
  );
}
