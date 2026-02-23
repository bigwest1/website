import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Photos | Jesse Westlund",
  description: "A visual look at Jesse Westlund across professional and creative contexts.",
  alternates: { canonical: "/about/photos" }
};

const photos = [
  "headshot0.png",
  "headshot1.jpg",
  "headshot2.jpg",
  "headshot3.jpg",
  "headshot4.jpg",
  "headshot5.jpg",
  "headshot6.jpg",
  "headshot7.jpg",
  "headshot8.jpg"
];

export default function PhotosPage() {
  return (
    <section className="section">
      <div className="container">
        <p className="section-kicker">Photo Archive</p>
        <h1 className="section-title">The Person Behind the Portfolio</h1>
        <div className="card-grid" style={{ marginTop: "1.2rem" }}>
          {photos.map((photo) => (
            <div key={photo} className="glass-card" style={{ overflow: "hidden", minHeight: "220px", position: "relative" }}>
              <Image
                src={`/images/photos/${photo}`}
                alt={`Jesse Westlund photo ${photo}`}
                fill
                sizes="(max-width: 1040px) 100vw, 33vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
