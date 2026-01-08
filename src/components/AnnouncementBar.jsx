import { useState, useEffect } from "react";
import { Truck, Zap, Package } from "lucide-react";
import "./AnnouncementBar.css";

export default function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const messages = [
    {
      id: 1,
      text: (
        <>
          Standard Shipping{" "}
          <span className="announcement-highlight">$9.99 AUD</span> (2-6 Days)
        </>
      ),
      icon: <Truck size={18} className="announcement-icon" />,
    },
    {
      id: 2,
      text: (
        <>
          Free Express Shipping on Orders{" "}
          <span className="announcement-highlight">Over $250</span>
        </>
      ),
      icon: <Package size={18} className="announcement-icon" />,
    },
    {
      id: 3,
      text: (
        <>
          <span className="announcement-highlight">Express Available</span>{" "}
          &nbsp;|&nbsp; 1-3 Days Delivery
        </>
      ),
      icon: <Zap size={18} className="announcement-icon" />,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="announcement-bar">
      {messages.map((msg, index) => (
        <div
          key={msg.id}
          className={`announcement-content ${
            index === currentIndex ? "active" : ""
          }`}
        >
          {msg.icon}
          <span>{msg.text}</span>
        </div>
      ))}
    </div>
  );
}
