import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Car,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  HardHat,
  Linkedin,
  Loader2,
  Mail,
  Menu,
  Package,
  Phone,
  Shield,
  ShoppingCart,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useActor } from "./hooks/useActor";

// ─── Scroll Reveal Hook ──────────────────────────────────────────
function useScrollReveal() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );

    const elements = document.querySelectorAll(".reveal, .service-card");
    for (const el of elements) {
      observerRef.current?.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, []);
}

// ─── Counter Hook ────────────────────────────────────────────────
function useCounter(end: number, duration = 2000, suffix = "") {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, end, duration]);

  return { count, ref, suffix };
}

// ─── Navbar ──────────────────────────────────────────────────────
function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsOpen(false);
  }, []);

  const navLinks = [
    { label: "Services", id: "services" },
    { label: "Admin", id: "admin", isRoute: true, href: "/admin" },
    { label: "About", id: "about" },
    { label: "Industries", id: "industries" },
    { label: "How We Work", id: "process" },
    { label: "Contact", id: "contact" },
  ];

  return (
    <nav
      data-ocid="nav.panel"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-md"
          : "bg-white/90 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex-shrink-0"
            aria-label="Go to top"
          >
            <span
              className="font-display font-black text-xl md:text-2xl tracking-tight"
              style={{ color: "oklch(0.28 0.085 245)" }}
            >
              Hirevena
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) =>
              (link as any).isRoute ? (
                <a
                  key={link.id}
                  href={(link as any).href}
                  data-ocid={`nav.${link.id}.link`}
                  className="text-sm font-medium text-foreground/80 hover:text-brand-navy transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <button
                  type="button"
                  key={link.id}
                  data-ocid={`nav.${link.id}.link`}
                  onClick={() => scrollTo(link.id)}
                  className="text-sm font-medium text-foreground/80 hover:text-brand-navy transition-colors"
                >
                  {link.label}
                </button>
              ),
            )}
            <Button
              data-ocid="nav.request_proposal.button"
              onClick={() => scrollTo("contact")}
              className="bg-brand-blue hover:bg-brand-navy text-white font-semibold px-5 py-2 rounded-lg shadow-navy transition-all duration-200"
              style={{ backgroundColor: "oklch(0.55 0.17 245)" }}
            >
              Request Proposal
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            data-ocid="nav.mobile_menu.toggle"
            className="md:hidden p-2 rounded-md text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-border shadow-lg">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) =>
              (link as any).isRoute ? (
                <a
                  key={link.id}
                  href={(link as any).href}
                  data-ocid={`nav.mobile.${link.id}.link`}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-foreground hover:text-brand-navy hover:bg-brand-section rounded-md transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <button
                  type="button"
                  key={link.id}
                  data-ocid={`nav.mobile.${link.id}.link`}
                  onClick={() => scrollTo(link.id)}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-foreground hover:text-brand-navy hover:bg-brand-section rounded-md transition-colors"
                >
                  {link.label}
                </button>
              ),
            )}
            <Button
              data-ocid="nav.mobile.request_proposal.button"
              onClick={() => scrollTo("contact")}
              className="w-full mt-2 text-white font-semibold"
              style={{ backgroundColor: "oklch(0.55 0.17 245)" }}
            >
              Request Proposal
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Stat Counter ────────────────────────────────────────────────
function StatCounter({
  value,
  label,
  suffix = "+",
}: {
  value: number | string;
  label: string;
  suffix?: string;
}) {
  const numValue = typeof value === "number" ? value : 0;
  const { count, ref } = useCounter(numValue, 2200);
  const displayValue = typeof value === "string" ? value : `${count}${suffix}`;

  return (
    <div
      ref={ref}
      className="glass-card rounded-2xl px-6 py-5 text-center min-w-[140px] flex-1"
    >
      <div
        className="text-3xl md:text-4xl font-display font-black stat-animate"
        style={{ color: "oklch(0.55 0.17 245)" }}
      >
        {displayValue}
      </div>
      <div
        className="text-sm font-semibold mt-1"
        style={{ color: "oklch(0.28 0.085 245)" }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── Hero Section ────────────────────────────────────────────────
function HeroSection() {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
    >
      {/* Background image + overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/assets/generated/hero-bg.dim_1600x900.jpg')",
        }}
      />
      <div
        className="absolute inset-0 bg-gradient-hero"
        style={{
          background:
            "linear-gradient(135deg, rgba(11,60,93,0.90) 0%, rgba(30,144,255,0.65) 100%)",
        }}
      />

      {/* Decorative mesh */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(30,144,255,0.4) 0%, transparent 50%), 
                           radial-gradient(circle at 80% 20%, rgba(77,168,255,0.3) 0%, transparent 40%)`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="max-w-3xl">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-sm font-semibold"
            style={{
              background: "rgba(30,144,255,0.25)",
              color: "white",
              border: "1px solid rgba(77,168,255,0.4)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full bg-brand-gold animate-pulse"
              style={{ backgroundColor: "oklch(0.82 0.17 80)" }}
            />
            Trusted by 50+ Industrial Companies Across India
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-white leading-tight tracking-tight mb-6">
            Reliable Workforce Solutions{" "}
            <span
              className="block"
              style={{
                background:
                  "linear-gradient(90deg, rgba(77,168,255,1), rgba(255,255,255,0.9))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              for Growing Industries
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/85 font-body leading-relaxed mb-8 max-w-2xl">
            At Hirevena –{" "}
            <em className="italic font-semibold text-white">
              Where Hiring Never Stops
            </em>{" "}
            – we deploy verified, skilled talent within{" "}
            <strong className="text-white font-bold">7 days</strong>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button
              data-ocid="hero.primary_button"
              size="lg"
              onClick={() => scrollTo("contact")}
              className="font-bold text-white shadow-navy px-8 py-4 text-base rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-xl"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.55 0.17 245), oklch(0.68 0.14 245))",
                backgroundColor: "oklch(0.55 0.17 245)",
              }}
            >
              Request Hiring Proposal
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <Button
              data-ocid="hero.secondary_button"
              size="lg"
              variant="outline"
              onClick={() => scrollTo("contact")}
              className="font-bold border-2 border-white text-white bg-transparent hover:bg-white/10 px-8 py-4 text-base rounded-xl transition-all duration-200"
            >
              <Phone className="w-5 h-5 mr-2" />
              Speak to Hiring Expert
            </Button>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-4">
            <StatCounter value={1000} label="Candidates Placed" suffix="+" />
            <StatCounter value={50} label="Corporate Clients" suffix="+" />
            <StatCounter value="7 Days" label="Average Hiring" suffix="" />
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          aria-hidden="true"
          role="presentation"
        >
          <title>Wave divider</title>
          <path
            d="M0 40 C360 80 1080 0 1440 40 L1440 80 L0 80 Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}

// ─── Testimonials / Client Voice Section ─────────────────────────
function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "Hirevena filled 80 production operators for our new plant line in just 9 days. We've never seen that speed from any agency before.",
      name: "Rakesh Mehta",
      title: "Plant Head – Auto Components Manufacturer, Pune",
      initial: "R",
    },
    {
      quote:
        "The pre-screening process saved our HR team weeks of work. Every candidate was document-verified and ready to join the floor immediately.",
      name: "Priya Nair",
      title: "HR Manager – FMCG Manufacturing, Bengaluru",
      initial: "P",
    },
    {
      quote:
        "We struggled with ITI welder recruitment for months. Hirevena delivered 30 certified candidates within 2 weeks. Outstanding network.",
      name: "Sandeep Gupta",
      title: "Operations Director – Engineering Company, Gujarat",
      initial: "S",
    },
  ];

  return (
    <section
      id="testimonials"
      data-ocid="testimonials.section"
      className="py-20"
      style={{ backgroundColor: "oklch(0.97 0.025 240)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 reveal">
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4 text-white"
            style={{ backgroundColor: "oklch(0.55 0.17 245)" }}
          >
            Client Voices
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-black text-navy mb-4">
            What Our Clients Say
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Real outcomes from HR managers, plant heads, and operations leaders
            across India's industrial sector.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              data-ocid={`testimonials.item.${i + 1}`}
              className={`reveal reveal-delay-${i + 1} bg-white rounded-2xl p-7 shadow-card border border-border flex flex-col card-hover`}
            >
              {/* Quote mark */}
              <div
                className="text-5xl font-display font-black leading-none mb-4 select-none"
                style={{ color: "oklch(0.55 0.17 245)", opacity: 0.25 }}
                aria-hidden="true"
              >
                "
              </div>
              <p className="text-sm text-foreground/75 leading-relaxed flex-1 mb-6 font-body italic">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-display font-black text-sm flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.28 0.085 245), oklch(0.55 0.17 245))",
                  }}
                >
                  {t.initial}
                </div>
                <div>
                  <div className="font-display font-bold text-navy text-sm">
                    {t.name}
                  </div>
                  <div className="text-xs text-muted-foreground leading-snug">
                    {t.title}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Credibility strip */}
        <div className="mt-12 reveal">
          <div className="bg-white rounded-2xl border border-border shadow-card px-8 py-6 flex flex-col sm:flex-row items-center justify-around gap-6 text-center">
            {[
              { value: "1,000+", label: "Candidates Placed" },
              { value: "50+", label: "Corporate Clients" },
              { value: "200+", label: "ITI College Network" },
              { value: "7 Days", label: "Avg. Deployment" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <span
                  className="text-2xl font-display font-black"
                  style={{ color: "oklch(0.55 0.17 245)" }}
                >
                  {stat.value}
                </span>
                <span className="text-xs font-semibold text-muted-foreground mt-0.5">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── About Section ───────────────────────────────────────────────
function AboutSection() {
  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Verified Talent Database",
      desc: "Pre-screened, background-verified candidates ready to deploy.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Dedicated Account Manager",
      desc: "Single point of contact for all your hiring needs.",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Fast Hiring Process",
      desc: "From requirement to deployment in as little as 7 days.",
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Cost-Effective Solutions",
      desc: "Reduce HR overhead with our managed recruitment model.",
    },
  ];

  return (
    <section id="about" data-ocid="about.section" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: Text */}
          <div className="reveal">
            <div
              className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4 text-white"
              style={{ backgroundColor: "oklch(0.55 0.17 245)" }}
            >
              Why Hirevena
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-black text-navy mb-6 leading-tight">
              Why Companies Choose Hirevena
            </h2>
            <div className="space-y-4 text-base text-foreground/75 font-body leading-relaxed">
              <p>
                Hirevena is India's fastest-growing workforce solutions company,
                built specifically for the demands of industrial and
                manufacturing hiring. We specialize in{" "}
                <strong className="text-foreground font-semibold">
                  bulk hiring
                </strong>{" "}
                — sourcing and deploying large volumes of skilled workers for
                factories, plants, and production floors without the
                administrative burden.
              </p>
              <p>
                Our{" "}
                <strong className="text-foreground font-semibold">
                  ITI & Diploma Candidate Sourcing
                </strong>{" "}
                network spans over 200 ITI institutions and technical colleges
                across India, giving us access to a pre-qualified pipeline of
                technically trained workers.
              </p>
              <p>
                Every candidate in our database undergoes rigorous{" "}
                <strong className="text-foreground font-semibold">
                  pre-screening
                </strong>{" "}
                — background verification, skill assessment, and document
                validation — so you only meet hire-ready talent. This reduces
                your HR workload by up to 70% and cuts average hiring time from
                45 days to just 7–14 days.
              </p>
              <ul className="space-y-2 mt-4">
                {[
                  "Production operator recruitment for assembly lines",
                  "Pre-screened talent pool of 10,000+ verified candidates",
                  "Reduced total hiring cost by 30–40%",
                  "Faster deployment with dedicated recruiter support",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      style={{ color: "oklch(0.55 0.17 245)" }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`reveal reveal-delay-${i + 1} card-hover bg-white rounded-2xl p-6 shadow-card border border-border group`}
                style={{ borderTop: "3px solid oklch(0.55 0.17 245)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
                  style={{
                    backgroundColor: "oklch(0.97 0.025 240)",
                    color: "oklch(0.55 0.17 245)",
                  }}
                >
                  {f.icon}
                </div>
                <h3 className="font-display font-bold text-navy text-base mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Services Section ────────────────────────────────────────────
function ServicesSection() {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const services = [
    {
      icon: <Users className="w-7 h-7" />,
      title: "Bulk Workforce Hiring",
      desc: "We source and deploy large volumes of skilled workers for industrial projects, quickly and reliably.",
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: "ITI & Diploma Recruitment",
      desc: "Specialized sourcing of ITI and diploma-certified technical candidates for manufacturing roles.",
    },
    {
      icon: <Building2 className="w-7 h-7" />,
      title: "Production Operator Staffing",
      desc: "Vetted production and floor operators ready for immediate deployment in your facility.",
    },
    {
      icon: <CheckCircle2 className="w-7 h-7" />,
      title: "Permanent Staffing",
      desc: "End-to-end permanent hiring for mid to senior-level roles in operations and management.",
    },
    {
      icon: <ArrowRight className="w-7 h-7" />,
      title: "Contract Staffing",
      desc: "Flexible contract workforce solutions to scale up or down based on project demands.",
    },
    {
      icon: <Zap className="w-7 h-7" />,
      title: "HR Outsourcing",
      desc: "Full HR process outsourcing so your team can focus on business growth.",
    },
  ];

  return (
    <section
      id="services"
      data-ocid="services.section"
      className="py-20"
      style={{ backgroundColor: "oklch(0.97 0.025 240)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 reveal">
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4 text-white"
            style={{ backgroundColor: "oklch(0.55 0.17 245)" }}
          >
            Our Services
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-black text-navy mb-4">
            Our Recruitment Services
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Comprehensive workforce solutions designed for India's industrial
            sector.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <div
              key={s.title}
              className={`service-card reveal-delay-${i + 1} group glass-card rounded-2xl p-7 card-hover flex flex-col`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors group-hover:bg-blue-accent text-white"
                style={{ backgroundColor: "oklch(0.55 0.17 245)" }}
              >
                {s.icon}
              </div>
              <h3 className="font-display font-bold text-navy text-lg mb-2">
                {s.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">
                {s.desc}
              </p>
              <button
                type="button"
                data-ocid={`services.get_hiring_plan.button.${i + 1}`}
                onClick={() => scrollTo("contact")}
                className="flex items-center gap-1 text-sm font-bold transition-colors"
                style={{ color: "oklch(0.55 0.17 245)" }}
              >
                Get Hiring Plan
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Process Timeline ────────────────────────────────────────────
function ProcessSection() {
  const steps = [
    {
      num: "01",
      title: "Requirement Analysis",
      desc: "We study your workforce needs, timeline, and role specifications in detail.",
    },
    {
      num: "02",
      title: "Candidate Screening",
      desc: "Our recruiters shortlist from our pre-verified talent database of 10,000+ candidates.",
    },
    {
      num: "03",
      title: "Interview Coordination",
      desc: "We schedule and manage all interviews at your convenience and location.",
    },
    {
      num: "04",
      title: "Final Deployment",
      desc: "Candidates are onboarded and deployed within your agreed timeline.",
    },
  ];

  return (
    <section
      id="process"
      data-ocid="process.section"
      className="py-20 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 reveal">
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4 text-white"
            style={{ backgroundColor: "oklch(0.55 0.17 245)" }}
          >
            Our Process
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-black text-navy mb-4">
            How We Work
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A streamlined process that gets the right people to your facility,
            fast.
          </p>
        </div>

        {/* Desktop: horizontal */}
        <div className="hidden md:block relative">
          {/* Connector line */}
          <div
            className="absolute top-10 left-[10%] right-[10%] h-0.5"
            style={{ backgroundColor: "oklch(0.90 0.02 240)" }}
          />
          <div className="grid grid-cols-4 gap-6 relative">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`reveal reveal-delay-${i + 1} flex flex-col items-center text-center`}
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white font-display font-black text-xl mb-5 shadow-navy relative z-10"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.28 0.085 245), oklch(0.55 0.17 245))",
                  }}
                >
                  {step.num}
                </div>
                <h3 className="font-display font-bold text-navy text-base mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: vertical */}
        <div className="md:hidden space-y-0">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`reveal reveal-delay-${i + 1} flex gap-5`}
            >
              <div className="flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0 shadow-navy"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.28 0.085 245), oklch(0.55 0.17 245))",
                  }}
                >
                  {step.num}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="w-0.5 flex-1 my-2"
                    style={{ backgroundColor: "oklch(0.90 0.02 240)" }}
                  />
                )}
              </div>
              <div className="pb-8">
                <h3 className="font-display font-bold text-navy text-base mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Industries Section ──────────────────────────────────────────
function IndustriesSection() {
  const industries = [
    { icon: <Building2 className="w-8 h-8" />, label: "Manufacturing" },
    { icon: <Car className="w-8 h-8" />, label: "Automobile" },
    { icon: <Wrench className="w-8 h-8" />, label: "Engineering" },
    { icon: <Package className="w-8 h-8" />, label: "Warehousing" },
    { icon: <HardHat className="w-8 h-8" />, label: "Construction" },
    { icon: <ShoppingCart className="w-8 h-8" />, label: "FMCG" },
  ];

  return (
    <section
      id="industries"
      data-ocid="industries.section"
      className="py-20"
      style={{ backgroundColor: "oklch(0.97 0.025 240)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 reveal">
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4 text-white"
            style={{ backgroundColor: "oklch(0.55 0.17 245)" }}
          >
            Sectors
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-black text-navy mb-4">
            Industries We Serve
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Deep domain expertise across India's core industrial sectors.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
          {industries.map((ind, i) => (
            <div
              key={ind.label}
              className={`reveal reveal-delay-${i + 1} card-hover bg-white rounded-2xl p-6 flex flex-col items-center gap-3 shadow-card cursor-default`}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: "oklch(0.97 0.025 240)",
                  color: "oklch(0.55 0.17 245)",
                }}
              >
                {ind.icon}
              </div>
              <span className="font-display font-bold text-navy text-sm text-center">
                {ind.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Results / Comparison Table ──────────────────────────────────
function ResultsSection() {
  const rows = [
    {
      feature: "Time to Fill",
      traditional: "30–60 Days",
      hirevena: "7–14 Days",
    },
    {
      feature: "Candidate Verification",
      traditional: "Self-managed",
      hirevena: "Pre-screened & Verified",
    },
    {
      feature: "HR Workload",
      traditional: "Very High",
      hirevena: "Minimal – We Handle It",
    },
    {
      feature: "Dedicated Recruiter",
      traditional: "No",
      hirevena: "Yes – Single POC",
    },
    {
      feature: "Cost Efficiency",
      traditional: "Unpredictable",
      hirevena: "Fixed & Transparent",
    },
    {
      feature: "Talent Pool Access",
      traditional: "Limited",
      hirevena: "10,000+ Verified Candidates",
    },
  ];

  return (
    <section
      id="results"
      data-ocid="results.section"
      className="py-20 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 reveal">
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4 text-white"
            style={{ backgroundColor: "oklch(0.55 0.17 245)" }}
          >
            The Hirevena Advantage
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-black text-navy mb-4">
            Reduce Hiring Time by 40%
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See how Hirevena's model outperforms traditional hiring in every
            dimension.
          </p>
        </div>

        <div className="reveal overflow-hidden rounded-2xl shadow-card border border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-4 md:p-6 font-display font-bold text-navy text-sm bg-white w-1/3">
                    Feature
                  </th>
                  <th
                    className="p-4 md:p-6 font-display font-bold text-sm text-center w-1/3"
                    style={{
                      backgroundColor: "oklch(0.95 0.005 245)",
                      color: "oklch(0.45 0.02 245)",
                    }}
                  >
                    Traditional Hiring
                  </th>
                  <th
                    className="p-4 md:p-6 font-display font-bold text-sm text-center w-1/3 text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.28 0.085 245), oklch(0.55 0.17 245))",
                    }}
                  >
                    Hirevena Model ✓
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={i % 2 === 0 ? "bg-white" : ""}
                    style={
                      i % 2 !== 0
                        ? { backgroundColor: "oklch(0.98 0.01 240)" }
                        : undefined
                    }
                  >
                    <td className="p-4 md:p-5 font-semibold text-sm text-navy border-t border-border">
                      {row.feature}
                    </td>
                    <td
                      className="p-4 md:p-5 text-center text-sm border-t border-border"
                      style={{
                        color: "oklch(0.55 0.02 245)",
                        backgroundColor:
                          i % 2 === 0
                            ? "oklch(0.97 0.005 245)"
                            : "oklch(0.94 0.005 245)",
                      }}
                    >
                      {row.traditional}
                    </td>
                    <td
                      className="p-4 md:p-5 text-center text-sm font-semibold border-t border-border/30 text-white"
                      style={{
                        backgroundColor:
                          i % 2 === 0
                            ? "oklch(0.40 0.11 245)"
                            : "oklch(0.35 0.10 245)",
                      }}
                    >
                      <span className="flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        {row.hirevena}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Lead Capture Form ───────────────────────────────────────────
function LeadCaptureSection() {
  const { actor, isFetching: actorLoading } = useActor();
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    role: "",
    positions: "",
    urgency: "",
    jobLocation: "",
    message: "",
  });
  const [formError, setFormError] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      // Combine optional fields into role and positions so they are stored in the backend
      const roleWithLocation = [
        form.role,
        form.jobLocation ? `Location: ${form.jobLocation}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
      const positionsWithMessage = [
        form.positions,
        form.message ? `Note: ${form.message}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
      await actor.createSubmission(
        form.companyName,
        form.contactName,
        form.phone,
        form.email,
        roleWithLocation || "-",
        positionsWithMessage || "-",
        form.urgency,
      );
    },
  });

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.companyName.trim())
      errors.companyName = "Company name is required.";
    if (!form.contactName.trim())
      errors.contactName = "Contact person name is required.";
    if (!form.phone.trim()) errors.phone = "Mobile number is required.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "Valid official email is required.";
    if (!form.urgency) errors.urgency = "Please select urgency level.";
    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setFormError(errors);
    if (Object.keys(errors).length > 0) return;
    mutation.mutate();
  };

  const update =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setFormError((prev) => ({ ...prev, [field]: "" }));
    };

  const updateTextarea =
    (field: string) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  return (
    <section
      id="contact"
      data-ocid="lead_form.section"
      className="py-24 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.28 0.085 245) 0%, oklch(0.55 0.17 245) 100%)",
      }}
    >
      {/* Decorative */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 10% 50%, rgba(255,255,255,0.3) 0%, transparent 40%),
                           radial-gradient(circle at 90% 20%, rgba(255,255,255,0.2) 0%, transparent 35%)`,
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-3">
            Get Skilled Workforce in 48 Hours
          </h2>
          <p className="text-base text-white/80 max-w-xl mx-auto leading-relaxed">
            Tell us your hiring requirement and our recruitment specialists will
            contact you within 2 hours.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-navy p-8 md:p-10">
          {mutation.isSuccess ? (
            <div
              data-ocid="lead_form.success_state"
              className="text-center py-12"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: "oklch(0.97 0.025 240)" }}
              >
                <CheckCircle2
                  className="w-9 h-9"
                  style={{ color: "oklch(0.55 0.17 245)" }}
                />
              </div>
              <h3 className="text-2xl font-display font-black text-navy mb-3">
                Thank You!
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Thank you. Our hiring specialist will contact you shortly.
              </p>
              <Button
                className="mt-6 text-white font-bold"
                style={{ backgroundColor: "oklch(0.55 0.17 245)" }}
                onClick={() => mutation.reset()}
              >
                Submit Another Request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {mutation.isError && (
                <div
                  data-ocid="lead_form.error_state"
                  className="mb-6 p-4 rounded-xl border text-sm font-medium"
                  style={{
                    backgroundColor: "oklch(0.98 0.01 27)",
                    borderColor: "oklch(0.85 0.1 27)",
                    color: "oklch(0.45 0.2 27)",
                  }}
                >
                  Submit nahi ho paya. Kripya dobara try karein ya seedha call
                  karein: +91 95697 32215
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Company Name */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="companyName"
                    className="font-semibold text-navy text-sm"
                  >
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    data-ocid="lead_form.company_name.input"
                    placeholder="e.g. Tata Motors Ltd."
                    value={form.companyName}
                    onChange={update("companyName")}
                    className="rounded-xl border-border"
                    aria-invalid={!!formError.companyName}
                  />
                  {formError.companyName && (
                    <p
                      data-ocid="lead_form.company_name.error_state"
                      className="text-xs text-destructive"
                    >
                      {formError.companyName}
                    </p>
                  )}
                </div>

                {/* Contact Person Name */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="contactName"
                    className="font-semibold text-navy text-sm"
                  >
                    Contact Person Name{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contactName"
                    data-ocid="lead_form.contact_name.input"
                    placeholder="e.g. Rahul Sharma"
                    value={form.contactName}
                    onChange={update("contactName")}
                    className="rounded-xl border-border"
                    aria-invalid={!!formError.contactName}
                  />
                  {formError.contactName && (
                    <p
                      data-ocid="lead_form.contact_name.error_state"
                      className="text-xs text-destructive"
                    >
                      {formError.contactName}
                    </p>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="phone"
                    className="font-semibold text-navy text-sm"
                  >
                    Mobile Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    data-ocid="lead_form.phone.input"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={update("phone")}
                    className="rounded-xl border-border"
                    autoComplete="tel"
                    aria-invalid={!!formError.phone}
                  />
                  {formError.phone && (
                    <p
                      data-ocid="lead_form.phone.error_state"
                      className="text-xs text-destructive"
                    >
                      {formError.phone}
                    </p>
                  )}
                </div>

                {/* Official Email */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="email"
                    className="font-semibold text-navy text-sm"
                  >
                    Official Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    data-ocid="lead_form.email.input"
                    placeholder="hr@yourcompany.com"
                    value={form.email}
                    onChange={update("email")}
                    className="rounded-xl border-border"
                    autoComplete="email"
                    aria-invalid={!!formError.email}
                  />
                  {formError.email && (
                    <p
                      data-ocid="lead_form.email.error_state"
                      className="text-xs text-destructive"
                    >
                      {formError.email}
                    </p>
                  )}
                </div>

                {/* Hiring Position */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="role"
                    className="font-semibold text-navy text-sm"
                  >
                    Hiring Position
                  </Label>
                  <Input
                    id="role"
                    data-ocid="lead_form.role.input"
                    placeholder="e.g. Production Operator, ITI Welder"
                    value={form.role}
                    onChange={update("role")}
                    className="rounded-xl border-border"
                  />
                </div>

                {/* Number of Candidates Required */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="positions"
                    className="font-semibold text-navy text-sm"
                  >
                    Number of Candidates Required
                  </Label>
                  <Input
                    id="positions"
                    data-ocid="lead_form.positions.input"
                    placeholder="e.g. 50"
                    value={form.positions}
                    onChange={update("positions")}
                    className="rounded-xl border-border"
                  />
                </div>

                {/* Job Location */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="jobLocation"
                    className="font-semibold text-navy text-sm"
                  >
                    Job Location
                  </Label>
                  <Input
                    id="jobLocation"
                    data-ocid="lead_form.job_location.input"
                    placeholder="e.g. Pune, Mumbai, Bengaluru"
                    value={form.jobLocation}
                    onChange={update("jobLocation")}
                    className="rounded-xl border-border"
                  />
                </div>

                {/* Urgency Level */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="urgency"
                    className="font-semibold text-navy text-sm"
                  >
                    Urgency Level <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.urgency}
                    onValueChange={(val) => {
                      setForm((prev) => ({ ...prev, urgency: val }));
                      setFormError((prev) => ({ ...prev, urgency: "" }));
                    }}
                  >
                    <SelectTrigger
                      data-ocid="lead_form.urgency.select"
                      className="rounded-xl border-border"
                    >
                      <SelectValue placeholder="Select urgency level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="within_7_days">
                        Within 7 Days
                      </SelectItem>
                      <SelectItem value="within_30_days">
                        Within 30 Days
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {formError.urgency && (
                    <p
                      data-ocid="lead_form.urgency.error_state"
                      className="text-xs text-destructive"
                    >
                      {formError.urgency}
                    </p>
                  )}
                </div>

                {/* Message / Additional Requirements - full width */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label
                    htmlFor="message"
                    className="font-semibold text-navy text-sm"
                  >
                    Message / Additional Requirements
                  </Label>
                  <Textarea
                    id="message"
                    data-ocid="lead_form.message.textarea"
                    placeholder="Tell us more about your hiring requirements, preferred skills, work timings, or any other details..."
                    value={form.message}
                    onChange={updateTextarea("message")}
                    className="rounded-xl border-border resize-none min-h-[100px]"
                    rows={4}
                  />
                </div>
              </div>

              <Button
                type="submit"
                data-ocid="lead_form.submit_button"
                size="lg"
                disabled={mutation.isPending || actorLoading}
                className="w-full mt-8 text-white font-bold text-base rounded-xl py-4 shadow-navy transition-all duration-200 hover:scale-[1.01]"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.28 0.085 245), oklch(0.55 0.17 245))",
                }}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : actorLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Request Workforce Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-5">
                {[
                  "10 Day Replacement Guarantee",
                  "100% Pre-Screened Candidates",
                  "Fast Industrial Hiring",
                ].map((badge) => (
                  <span
                    key={badge}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
                  >
                    <CheckCircle2
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: "oklch(0.55 0.17 245)" }}
                    />
                    {badge}
                  </span>
                ))}
              </div>

              <p className="text-center text-xs text-muted-foreground mt-4">
                By submitting, you agree to our Privacy Policy. We never share
                your data.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────
function Footer() {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const year = new Date().getFullYear();

  return (
    <footer
      id="footer"
      data-ocid="footer.panel"
      className="text-white"
      style={{ backgroundColor: "oklch(0.28 0.085 245)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* About */}
          <div>
            <div className="mb-4">
              <span className="font-display font-black text-2xl tracking-tight text-white">
                Hirevena
              </span>
            </div>
            <p className="text-sm text-white/65 leading-relaxed mb-4">
              Hirevena is India's trusted recruitment partner for manufacturing
              and industrial companies. We specialize in bulk hiring, ITI &
              diploma recruitment, and workforce staffing solutions.
            </p>
            <p className="text-sm font-semibold italic text-white/80">
              "Where Hiring Never Stops."
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-display font-bold text-white text-sm uppercase tracking-widest mb-5">
              Services
            </h3>
            <ul className="space-y-2.5">
              {[
                "Bulk Hiring",
                "ITI Recruitment",
                "Production Staffing",
                "Contract Staffing",
                "HR Outsourcing",
              ].map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => scrollTo("services")}
                    className="text-sm text-white/65 hover:text-white transition-colors text-left"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Industries */}
          <div>
            <h3 className="font-display font-bold text-white text-sm uppercase tracking-widest mb-5">
              Industries
            </h3>
            <ul className="space-y-2.5">
              {[
                "Manufacturing",
                "Automobile",
                "Engineering",
                "Warehousing",
                "Construction",
                "FMCG",
              ].map((ind) => (
                <li key={ind}>
                  <button
                    type="button"
                    onClick={() => scrollTo("industries")}
                    className="text-sm text-white/65 hover:text-white transition-colors text-left"
                  >
                    {ind}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-bold text-white text-sm uppercase tracking-widest mb-5">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-white/60 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/70">+91 95697 32215</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-white/60 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/70">
                  utkarshshakya6@gmail.com
                </span>
              </li>
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors mt-1"
                  aria-label="Hirevena on LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="border-t py-5"
        style={{ borderColor: "rgba(255,255,255,0.12)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/55">
          <span>
            © {year} Hirevena. All rights reserved. |{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "hirevena")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/90 transition-colors"
            >
              Built with ❤ using caffeine.ai
            </a>
          </span>
          <div className="flex gap-4">
            <button
              type="button"
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              className="hover:text-white transition-colors"
            >
              Terms &amp; Conditions
            </button>
            <button
              type="button"
              className="hover:text-white transition-colors"
            >
              Sitemap
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── WhatsApp Button ─────────────────────────────────────────────
function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/919569732215"
      target="_blank"
      rel="noopener noreferrer"
      data-ocid="whatsapp.button"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg whatsapp-pulse transition-transform hover:scale-110"
      style={{ backgroundColor: "#25D366" }}
    >
      {/* WhatsApp SVG icon */}
      <svg
        viewBox="0 0 24 24"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
        className="w-7 h-7"
        aria-hidden="true"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    </a>
  );
}

// ─── Main App ────────────────────────────────────────────────────
export default function App() {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-white font-body">
      <Navbar />
      <main>
        <HeroSection />
        <TestimonialsSection />
        <AboutSection />
        <ServicesSection />
        <ProcessSection />
        <IndustriesSection />
        <ResultsSection />
        <LeadCaptureSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
