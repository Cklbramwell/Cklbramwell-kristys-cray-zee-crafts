export default function ProductGallery({ product }) {
  const images = [product.imageUrl, product.imageUrl2, product.imageUrl3]
    .filter(Boolean);

  if (!images.length) {
    return <div className="product-detail-placeholder">{product.emoji || "🎨"}</div>;
  }

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        <img src={images[0]} alt={product.name}/>
      </div>
      {images.length > 1 && (
        <div className="product-gallery-thumbs">
          {images.map((src,index)=><img src={src} alt={`${product.name} ${index+1}`} key={src}/>)}
        </div>
      )}
    </div>
  );
}
