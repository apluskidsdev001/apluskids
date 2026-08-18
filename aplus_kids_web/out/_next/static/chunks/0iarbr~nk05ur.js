(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,49617,e=>{"use strict";var t=e.i(17139);e.s(["default",0,function(){return(0,t.useEffect)(()=>{let e=window.matchMedia("(prefers-reduced-motion: reduce)").matches,t=new WeakSet;function s(){document.querySelectorAll("[data-scroll-reveal]").forEach(e=>{t.has(e)||(t.add(e),a.observe(e))})}if(e)return void document.querySelectorAll("[data-scroll-reveal]").forEach(e=>e.classList.add("is-visible"));let a=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting?e.target.classList.add("is-visible"):e.target.classList.remove("is-visible")})},{rootMargin:"0px 0px -12% 0px",threshold:.08});requestAnimationFrame(s);let n=new MutationObserver(s);return n.observe(document.body,{childList:!0,subtree:!0}),()=>{a?.disconnect(),n.disconnect()}},[]),null}])},83431,e=>{"use strict";var t=e.i(52760),s=e.i(69564),a=e.i(40282);e.s(["default",0,function({type:e,src:n,href:l,alt:r="Advertisement"}){return n?(0,t.jsx)("section",{"data-scroll-reveal":"pop",className:"-mt-px w-full bg-white px-3 py-4 md:px-6 md:py-8",children:(0,t.jsx)("a",{href:l,target:"_blank",rel:"noopener noreferrer",className:"relative mx-auto block h-[132px] max-w-7xl overflow-hidden rounded-[22px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] md:h-[120px] md:rounded-3xl",children:"video"===e?(0,t.jsx)("video",{autoPlay:!0,muted:!0,loop:!0,playsInline:!0,className:"h-full w-full object-cover",children:(0,t.jsx)("source",{src:(0,a.sitePath)(n),type:"video/mp4"})}):(0,t.jsx)(s.default,{src:(0,a.sitePath)(n),alt:r,fill:!0,sizes:"(min-width: 1280px) 1280px, 100vw",className:"h-full w-full object-cover"})})}):(0,t.jsx)("section",{"data-scroll-reveal":"pop",className:"-mt-px w-full bg-white px-3 py-4 md:px-6 md:py-8",children:(0,t.jsx)("div",{className:"mx-auto flex h-[132px] max-w-7xl items-center justify-center rounded-[22px] bg-[#D9D9D9] md:h-[120px] md:rounded-3xl",children:(0,t.jsx)("p",{className:"text-[30px] font-bold text-[#6B6B6B] md:text-3xl",children:"advertisement here"})})})}])},86747,e=>{"use strict";var t=e.i(52760),s=e.i(49617),a=e.i(2933),n=e.i(40282),l=e.i(69564);let r=[{label:"Birthdays",icon:"/icons/shortcuts/cake.png",alt:"Birthday cake icon",target:"#birthdays"},{label:"Kids Champ",icon:"/icons/shortcuts/KidsChamp.png",alt:"Kids Champ icon",target:"#kids-champ-section"},{label:"Events",icon:"/icons/shortcuts/gallery.png",alt:"Events gallery icon",target:"#events"}];function o({content:e}){return(0,t.jsxs)("section",{className:"relative flex min-h-screen w-full items-center overflow-hidden bg-[#F7FCFF] px-4 pb-10 pt-[132px] sm:px-6 md:px-10 lg:px-16 xl:px-20",children:[(0,t.jsx)("div",{className:"pointer-events-none absolute left-0 top-[18%] h-40 w-40 rounded-full bg-[#FFE36E]/60 blur-3xl"}),(0,t.jsx)("div",{className:"pointer-events-none absolute right-0 top-[28%] h-56 w-56 rounded-full bg-[#13A8DF]/18 blur-3xl"}),(0,t.jsx)("div",{className:"pointer-events-none absolute bottom-0 left-[30%] h-44 w-44 rounded-full bg-[#F04B23]/16 blur-3xl"}),(0,t.jsx)("div",{className:"pointer-events-none absolute left-[27%] top-[20%] h-8 w-8 rotate-12 rounded-[9px] bg-[#F6A6D8]/42"}),(0,t.jsx)("div",{className:"pointer-events-none absolute left-[43%] bottom-[20%] h-5 w-5 rotate-45 rounded-[6px] bg-[#8D5CFF]/34"}),(0,t.jsx)("div",{className:"pointer-events-none absolute right-[13%] top-[16%] h-20 w-20 rounded-full bg-white/40 blur-2xl"}),(0,t.jsx)("div",{className:"pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-36 bg-[linear-gradient(180deg,rgba(247,252,255,0)_0%,rgba(247,252,255,0.72)_45%,#ffffff_100%)]"}),(0,t.jsxs)("div",{className:"relative z-10 mx-auto grid w-full max-w-[1220px] items-center gap-8 sm:gap-10 md:grid-cols-[1fr_0.92fr] lg:gap-10 xl:gap-12",children:[(0,t.jsx)("div",{className:"hero-text-enter max-w-[620px]",children:(0,t.jsxs)("div",{children:[(0,t.jsxs)("h1",{className:"font-bold leading-[1.08] text-black",children:[(0,t.jsx)("span",{className:"block text-[40px] sm:text-[48px] md:text-[55px] lg:text-[64px] xl:text-[70px]",children:(e?.title||"Welcome to").split("").map((e,s)=>(0,t.jsx)("span",{className:"welcome-letter inline-block",style:{animationDelay:`${90*s}ms`},children:" "===e?" ":e},`${e}-${s}`))}),(0,t.jsxs)("span",{className:"kids-zone-title mt-3 block font-bold leading-[0.95] text-[58px] text-[#071B63] sm:whitespace-nowrap sm:text-[72px] md:text-[86px] lg:text-[104px] xl:text-[118px]",children:[(0,t.jsx)("span",{className:"kids-zone-word text-[#13A8DF]",children:"Kids"})," ",(0,t.jsx)("span",{className:"kids-zone-word kids-zone-word-delay block text-[#F04B23] sm:inline",children:"Zone"})]})]}),(0,t.jsx)("p",{className:"mt-5 max-w-[500px] text-[18px] font-semibold leading-[1.45] text-black sm:text-[20px] md:text-[17px] lg:text-[20px] xl:text-[23px]",children:e?.description||"A safe and happy place for kids to celebrate, compete, explore and create amazing memories"}),(0,t.jsx)("div",{className:"mt-7 flex flex-wrap gap-3 sm:gap-4",children:r.map(e=>(0,t.jsxs)("a",{href:e.target,onClick:t=>{var s;t.preventDefault(),s=e.target,document.querySelector(s)?.scrollIntoView({behavior:"smooth",block:"start"})},className:"hero-chip relative inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white/95 py-2 pl-2.5 pr-5 text-[15px] font-bold text-[#071B63] no-underline shadow-[0_12px_28px_rgba(7,27,99,0.12)] backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:no-underline hover:shadow-[0_16px_34px_rgba(7,27,99,0.16)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#13A8DF]/30 sm:h-[60px] sm:gap-3 sm:pr-6 sm:text-[16px]",children:[(0,t.jsx)("span",{className:"relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7FCFF] shadow-[inset_0_0_0_1px_rgba(7,27,99,0.04)] sm:h-11 sm:w-11",children:(0,t.jsx)(l.default,{src:(0,n.sitePath)(e.icon),alt:e.alt,width:32,height:32,className:"h-7 w-7 object-contain sm:h-8 sm:w-8"})}),(0,t.jsx)("span",{className:"hero-chip-label relative z-10",children:e.label})]},e.label))})]})}),(0,t.jsx)("div",{className:"hero-visual-enter",children:(0,t.jsx)("div",{className:"flex justify-center md:justify-end",children:(0,t.jsxs)("div",{className:"relative w-full max-w-[600px] sm:max-w-[640px] md:max-w-[560px] lg:max-w-[610px] xl:max-w-[640px]",children:[(0,t.jsx)("div",{className:"absolute -left-4 -top-4 h-24 w-24 rounded-[8px] bg-[#FFE36E]"}),(0,t.jsx)("div",{className:"absolute -bottom-4 -right-4 h-28 w-28 rounded-[8px] bg-[#13A8DF]"}),(0,t.jsx)("div",{className:"relative overflow-hidden rounded-[8px] border-[10px] border-white bg-white shadow-[0_24px_70px_rgba(7,27,99,0.18)]",children:(0,t.jsx)("video",{autoPlay:!0,muted:!0,loop:!0,playsInline:!0,className:"block w-full scale-[1.08] border-0 bg-transparent object-contain outline-none",children:(0,t.jsx)("source",{src:(0,n.sitePath)("/videos/kidszone-hero/kidszone_hero.mp4"),type:"video/mp4"})})})]})})})]}),(0,t.jsx)("style",{children:`
        .kids-zone-title {
          animation: kidsZonePop 720ms cubic-bezier(0.2, 0.9, 0.2, 1.2)
            both;
        }

        .kids-zone-word {
          display: inline-block;
          overflow: hidden;
          position: relative;
        }

        .kids-zone-word::after {
          animation: kidsZoneShine 2.9s ease-in-out 1200ms infinite;
          background: linear-gradient(
            110deg,
            transparent 0%,
            rgba(255, 255, 255, 0.72) 45%,
            transparent 70%
          );
          content: "";
          inset: 0;
          position: absolute;
          transform: translateX(-120%);
        }

        .kids-zone-word-delay::after {
          animation-delay: 1.15s;
        }

        .welcome-letter {
          animation: welcomeLetterWave 2.8s ease-in-out infinite;
        }

        .hero-text-enter {
          animation: heroTextEnter 900ms cubic-bezier(0.2, 0.82, 0.2, 1)
            both;
          will-change: opacity, transform;
        }

        .hero-visual-enter {
          animation: heroVisualEnter 1000ms cubic-bezier(0.2, 0.82, 0.2, 1)
            120ms both;
          will-change: opacity, transform;
        }

        .hero-chip-label {
          pointer-events: none;
          white-space: nowrap;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-text-enter,
          .hero-visual-enter,
          .welcome-letter,
          .kids-zone-title,
          .kids-zone-word::after {
            animation: none;
          }
        }

        @keyframes kidsZonePop {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.94);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes kidsZoneShine {
          0% {
            transform: translateX(-120%);
          }

          45%,
          100% {
            transform: translateX(120%);
          }
        }

        @keyframes welcomeLetterWave {
          0%,
          100% {
            transform: translateY(0);
          }

          18% {
            transform: translateY(-6px);
          }

          36% {
            transform: translateY(0);
          }
        }

        @keyframes heroTextEnter {
          from {
            opacity: 0;
            transform: translate3d(-72px, 0, 0);
          }

          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes heroVisualEnter {
          from {
            opacity: 0;
            transform: translate3d(86px, 0, 0) scale(0.96);
          }

          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
      `})]})}var i=e.i(83431);let d=[{label:"TV Feature",icon:"/icons/taskbar/play.png",alt:"TV feature icon"},{label:"Birthday Shoutout",icon:"/icons/shortcuts/cake.png",alt:"Birthday cake icon"},{label:"Photo Wish",icon:"/icons/shortcuts/gallery.png",alt:"Photo wish icon"}];function c(){return(0,t.jsxs)("div",{className:"birthday-cake-stage relative mx-auto w-full max-w-[960px] overflow-visible bg-[#F5FBFF] md:-translate-x-12 lg:-translate-x-20 xl:-translate-x-28",children:[(0,t.jsx)("div",{className:"pointer-events-none absolute left-[20%] top-[24%] h-52 w-52 rounded-full bg-[#FFE36E]/42 blur-3xl"}),(0,t.jsx)("div",{className:"pointer-events-none absolute bottom-[18%] right-[18%] h-40 w-40 rounded-full bg-[#13A8DF]/16 blur-3xl"}),(0,t.jsx)("div",{className:"birthday-confetti confetti-one"}),(0,t.jsx)("div",{className:"birthday-confetti confetti-two"}),(0,t.jsx)("div",{className:"birthday-confetti confetti-three"}),(0,t.jsx)("div",{className:"birthday-confetti confetti-four"}),(0,t.jsx)("video",{autoPlay:!0,muted:!0,loop:!0,playsInline:!0,className:"block h-auto w-full bg-[#F5FBFF] object-contain",children:(0,t.jsx)("source",{src:(0,n.sitePath)("/videos/kidszone-hero/cake.mp4"),type:"video/mp4"})}),(0,t.jsx)("div",{className:"pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,251,255,0)_58%,#F5FBFF_86%)]"}),(0,t.jsx)("div",{className:"pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,#F5FBFF_0%,rgba(245,251,255,0)_100%)]"}),(0,t.jsx)("div",{className:"pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-[linear-gradient(180deg,rgba(245,251,255,0)_0%,#F5FBFF_88%)]"}),(0,t.jsx)("div",{className:"pointer-events-none absolute inset-y-0 left-0 w-16 bg-[linear-gradient(90deg,#F5FBFF_0%,rgba(245,251,255,0)_100%)]"}),(0,t.jsx)("div",{className:"pointer-events-none absolute inset-y-0 right-0 w-16 bg-[linear-gradient(270deg,#F5FBFF_0%,rgba(245,251,255,0)_100%)]"})]})}function x({content:e}){return(0,t.jsxs)("section",{id:"birthdays",className:"relative flex min-h-screen w-full scroll-mt-32 items-center overflow-hidden bg-[#F5FBFF] px-4 py-14 sm:px-6 md:px-10 lg:px-16 xl:px-20",children:[(0,t.jsx)("div",{className:"pointer-events-none absolute left-[7%] top-[18%] h-3 w-3 rounded-full bg-[#FFD23F]/70"}),(0,t.jsx)("div",{className:"pointer-events-none absolute left-[15%] bottom-[22%] h-4 w-4 rounded-full bg-[#13A8DF]/34"}),(0,t.jsx)("div",{className:"pointer-events-none absolute right-[8%] top-[24%] h-5 w-5 rounded-full bg-[#F04B23]/20"}),(0,t.jsx)("div",{className:"pointer-events-none absolute right-[18%] bottom-[18%] h-3 w-3 rounded-full bg-[#FFD23F]/64"}),(0,t.jsx)("div",{className:"pointer-events-none absolute left-[31%] top-[12%] h-16 w-16 rounded-full border border-[#13A8DF]/12"}),(0,t.jsx)("div",{className:"pointer-events-none absolute right-[38%] bottom-[10%] h-20 w-20 rounded-full border border-[#FFD23F]/22"}),(0,t.jsx)("div",{className:"pointer-events-none absolute left-[4%] bottom-[8%] h-40 w-40 rounded-full bg-[#FFD23F]/18 blur-3xl"}),(0,t.jsx)("div",{className:"pointer-events-none absolute right-[6%] top-[16%] h-44 w-44 rounded-full bg-[#13A8DF]/10 blur-3xl"}),(0,t.jsx)("div",{className:"pointer-events-none absolute left-[9%] top-[31%] h-2 w-8 rotate-12 rounded-full bg-[#F04B23]/28"}),(0,t.jsx)("div",{className:"pointer-events-none absolute left-[48%] bottom-[18%] h-2 w-7 -rotate-12 rounded-full bg-[#13A8DF]/28"}),(0,t.jsx)("div",{className:"pointer-events-none absolute right-[12%] top-[46%] h-2 w-8 rotate-[24deg] rounded-full bg-[#FFD23F]/70"}),(0,t.jsx)("div",{className:"pointer-events-none absolute right-[30%] top-[17%] h-3 w-3 rounded-full bg-[#F04B23]/22"}),(0,t.jsx)("div",{className:"pointer-events-none absolute left-[6%] top-[42%] h-2.5 w-2.5 rounded-full bg-[#FFD23F]/80"}),(0,t.jsx)("div",{className:"pointer-events-none absolute left-[12%] top-[57%] h-2 w-10 rotate-12 rounded-full bg-[#F04B23]/24"}),(0,t.jsx)("div",{className:"pointer-events-none absolute left-[24%] bottom-[16%] h-2 w-2 rounded-full bg-[#13A8DF]/45"}),(0,t.jsx)("div",{className:"pointer-events-none absolute left-[37%] top-[27%] h-3 w-3 rounded-full bg-[#FFD23F]/56"}),(0,t.jsx)("div",{className:"pointer-events-none absolute right-[21%] top-[33%] h-2.5 w-2.5 rounded-full bg-[#F04B23]/24"}),(0,t.jsx)("div",{className:"pointer-events-none absolute right-[18%] bottom-[28%] h-2 w-9 -rotate-[22deg] rounded-full bg-[#FFD23F]/80"}),(0,t.jsx)("div",{className:"pointer-events-none absolute right-[7%] bottom-[20%] h-16 w-16 rounded-full border border-[#13A8DF]/10"}),(0,t.jsx)("div",{className:"pointer-events-none absolute left-[50%] top-[18%] hidden h-14 w-14 rounded-full border border-[#FFD23F]/18 sm:block"}),(0,t.jsx)("div",{className:"pointer-events-none absolute right-[42%] top-[58%] hidden h-2.5 w-2.5 rounded-full bg-[#13A8DF]/34 md:block"}),(0,t.jsx)("div",{className:"pointer-events-none absolute left-[18%] bottom-[31%] hidden h-2 w-8 -rotate-[18deg] rounded-full bg-[#FFD23F]/62 md:block"}),(0,t.jsx)("div",{className:"pointer-events-none absolute right-[4%] top-[58%] hidden h-2 w-2 rounded-full bg-[#F04B23]/30 lg:block"}),(0,t.jsx)("div",{className:"pointer-events-none absolute left-[43%] bottom-[8%] hidden h-20 w-20 rounded-full border border-[#F04B23]/10 lg:block"}),(0,t.jsxs)("div",{className:"relative z-10 mx-auto grid w-full max-w-[1320px] items-center gap-8 md:grid-cols-[1.28fr_0.72fr] lg:gap-10",children:[(0,t.jsx)(c,{}),(0,t.jsxs)("div",{children:[(0,t.jsx)("span",{className:"text-[20px] font-medium uppercase tracking-normal text-[#13A8DF] sm:text-[24px]",children:"Birthday Wishes"}),(0,t.jsx)("h2",{className:"mt-3 text-[42px] font-medium leading-[1.1] text-black sm:text-[56px] lg:text-[66px]",children:e?.title||(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("span",{children:"Make Their"}),(0,t.jsx)("br",{}),"Day ",(0,t.jsx)("span",{className:"text-[#FFD23F]",children:"Special!"})]})}),(0,t.jsx)("p",{className:"mt-5 max-w-[560px] text-[22px] font-medium leading-[1.32] text-black/78 sm:text-[26px]",children:e?.description||"Send your birthday wishes and get featured on A+ Kids"}),(0,t.jsx)("div",{className:"mt-6 flex flex-wrap gap-3",children:d.map(e=>(0,t.jsxs)("span",{className:"inline-flex items-center gap-2 rounded-full bg-white/88 py-2 pl-2 pr-4 text-[15px] font-normal leading-none text-[#071B63] shadow-[0_10px_24px_rgba(7,27,99,0.07)] transition-transform hover:-translate-y-0.5 sm:text-[16px]",children:[(0,t.jsx)("span",{className:"flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5FBFF]",children:(0,t.jsx)(l.default,{src:(0,n.sitePath)(e.icon),alt:e.alt,width:24,height:24,className:"h-6 w-6 object-contain"})}),e.label]},e.label))}),(0,t.jsxs)("a",{href:e?.linkUrl||"/birthdays",className:"birthday-cta mt-9 inline-flex h-14 items-center gap-4 rounded-full bg-[#13A8DF] pl-7 pr-3 text-[21px] font-normal leading-none tracking-normal text-white no-underline shadow-[0_14px_28px_rgba(19,168,223,0.22)] transition-transform hover:scale-[1.03] hover:no-underline",children:[e?.linkLabel||"Send Birthday",(0,t.jsx)("span",{"aria-hidden":"true",className:"birthday-cta-arrow flex h-10 w-10 items-center justify-center rounded-full bg-[#071B63]",children:(0,t.jsx)(l.default,{src:(0,n.sitePath)("/icons/shortcuts/Arrow 1.png"),alt:"",width:22,height:22,className:"h-[22px] w-[22px] object-contain"})})]})]})]}),(0,t.jsx)("style",{children:`
        .birthday-cake-stage {
          animation: birthdayCakeFloat 5.8s ease-in-out infinite;
        }

        .birthday-confetti {
          border-radius: 9999px;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }

        .confetti-one {
          background: #ffd23f;
          height: 12px;
          left: 24%;
          top: 20%;
          width: 12px;
        }

        .confetti-two {
          background: #13a8df;
          height: 9px;
          right: 28%;
          top: 28%;
          width: 9px;
        }

        .confetti-three {
          background: #f04b23;
          bottom: 26%;
          height: 10px;
          left: 33%;
          width: 10px;
        }

        .confetti-four {
          background: #ffd23f;
          bottom: 31%;
          height: 8px;
          right: 20%;
          width: 8px;
        }

        .birthday-cta:hover .birthday-cta-arrow {
          animation: birthdayArrowNudge 520ms ease both;
        }

        @keyframes birthdayCakeFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes birthdayArrowNudge {
          0%,
          100% {
            transform: translateX(0);
          }

          48% {
            transform: translateX(5px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .birthday-cake-stage,
          .birthday-cta:hover .birthday-cta-arrow {
            animation: none;
          }
        }
      `})]})}function m(){return(0,t.jsxs)("div",{className:"relative mx-auto w-full max-w-[640px] overflow-visible bg-white lg:max-w-[700px]",children:[(0,t.jsx)("div",{className:"pointer-events-none absolute left-[18%] top-[18%] h-44 w-44 rounded-full bg-[#FFD23F]/24 blur-3xl"}),(0,t.jsx)("div",{className:"pointer-events-none absolute bottom-[14%] right-[16%] h-40 w-40 rounded-full bg-[#13A8DF]/12 blur-3xl"}),(0,t.jsx)("video",{autoPlay:!0,muted:!0,loop:!0,playsInline:!0,className:"relative z-10 block h-auto w-full bg-white object-contain",children:(0,t.jsx)("source",{src:(0,n.sitePath)("/videos/kidszone-hero/kidzChamp.mp4"),type:"video/mp4"})})]})}function p({content:e}){return(0,t.jsxs)("section",{id:"kids-champ-section",className:"relative flex min-h-screen w-full scroll-mt-32 items-center overflow-hidden bg-white px-4 py-14 sm:px-6 md:px-10 lg:px-16 xl:px-20",children:[(0,t.jsx)("div",{className:"pointer-events-none absolute left-[7%] top-[24%] h-3 w-3 rounded-full bg-[#FFD23F]/80"}),(0,t.jsx)("div",{className:"pointer-events-none absolute left-[32%] bottom-[16%] h-2.5 w-2.5 rounded-full bg-[#13A8DF]/38"}),(0,t.jsx)("div",{className:"pointer-events-none absolute left-[46%] top-[18%] h-2 w-9 rotate-12 rounded-full bg-[#FFD23F]/62"}),(0,t.jsx)("div",{className:"pointer-events-none absolute right-[8%] top-[30%] h-16 w-16 rounded-full border border-[#13A8DF]/12"}),(0,t.jsx)("div",{className:"pointer-events-none absolute right-[16%] bottom-[18%] h-2 w-10 -rotate-[22deg] rounded-full bg-[#0877EF]/18"}),(0,t.jsx)("div",{className:"pointer-events-none absolute right-[34%] top-[48%] h-3 w-3 rounded-full bg-[#F04B23]/22"}),(0,t.jsx)("div",{className:"pointer-events-none absolute left-[5%] bottom-[12%] h-36 w-36 rounded-full bg-[#FFD23F]/12 blur-3xl"}),(0,t.jsx)("div",{className:"pointer-events-none absolute right-[5%] top-[18%] h-40 w-40 rounded-full bg-[#13A8DF]/8 blur-3xl"}),(0,t.jsxs)("div",{className:"relative z-10 mx-auto grid w-full max-w-[1280px] items-center gap-8 md:grid-cols-[0.9fr_1.1fr] lg:gap-12",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("h2",{className:"text-[42px] font-medium leading-[1.12] text-black sm:text-[54px] lg:text-[66px]",children:e?.title||(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("span",{children:"Show Your"}),(0,t.jsx)("br",{}),(0,t.jsx)("span",{className:"text-[#FFD23F]",children:"Creativity"}),(0,t.jsx)("br",{}),"in ",(0,t.jsx)("span",{className:"text-[#13A8DF]",children:"Kids"})," ",(0,t.jsx)("span",{className:"text-[#0877EF]",children:"Champ!"})]})}),(0,t.jsx)("p",{className:"mt-5 max-w-[520px] text-[22px] font-medium leading-[1.32] text-black/78 sm:text-[26px]",children:e?.description||"Upload your artwork and share your talent with others"}),(0,t.jsxs)("a",{href:e?.linkUrl||"/kids-champ",className:"kids-champ-cta mt-9 inline-flex h-14 items-center gap-4 rounded-full bg-[#0B8ED8] pl-7 pr-3 text-[21px] font-normal leading-none tracking-normal text-white shadow-[0_14px_28px_rgba(11,142,216,0.22)] transition-transform hover:scale-[1.03]",children:[e?.linkLabel||"Upload Drawing",(0,t.jsx)("span",{"aria-hidden":"true",className:"kids-champ-cta-arrow flex h-10 w-10 items-center justify-center rounded-full bg-[#071B63]",children:(0,t.jsx)(l.default,{src:(0,n.sitePath)("/icons/shortcuts/Arrow 1.png"),alt:"",width:22,height:22,className:"h-[22px] w-[22px] object-contain"})})]})]}),(0,t.jsx)(m,{})]}),(0,t.jsx)("style",{children:`
        .kids-champ-cta:hover .kids-champ-cta-arrow {
          animation: kidsChampArrowNudge 520ms ease both;
        }

        @keyframes kidsChampArrowNudge {
          0%,
          100% {
            transform: translateX(0);
          }

          48% {
            transform: translateX(5px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .kids-champ-cta:hover .kids-champ-cta-arrow {
            animation: none;
          }
        }
      `})]})}let h=[{title:"School Visits",description:"Fun activities and learning moments with A+ Kids."},{title:"Family Days",description:"Weekend programs for kids, parents, and friends."},{title:"Creative Workshops",description:"Hands-on sessions for art, stories, music, and games."}];function u({content:e}){return(0,t.jsx)("section",{id:"events",className:"flex min-h-screen w-full scroll-mt-32 items-center bg-white px-4 py-12 sm:px-6 md:px-10 lg:px-16 xl:px-20",children:(0,t.jsxs)("div",{className:"mx-auto w-full max-w-[1180px]",children:[(0,t.jsxs)("div",{className:"max-w-[760px]",children:[(0,t.jsx)("span",{className:"text-[13px] font-bold uppercase tracking-[0.2em] text-[#F04B23]",children:"Explore"}),(0,t.jsx)("h2",{className:"mt-4 text-[42px] font-bold leading-[1.05] text-[#071B63] sm:text-[54px] md:text-[62px] lg:text-[76px] xl:text-[86px]",children:e?.title||(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("span",{children:"Events &"}),(0,t.jsx)("br",{}),"Memories"]})})]}),e?.description?(0,t.jsx)("p",{className:"mt-5 max-w-2xl text-[18px] font-medium leading-7 text-[#526382]",children:e.description}):null,(0,t.jsx)("div",{className:"mt-8 grid gap-4 sm:gap-5 md:grid-cols-3 lg:mt-12",children:h.map(e=>(0,t.jsxs)("article",{className:"min-h-[220px] rounded-[8px] bg-[#F7FCFF] p-6 shadow-[0_14px_35px_rgba(7,27,99,0.08)] sm:min-h-[250px] sm:p-7 md:min-h-[300px]",children:[(0,t.jsx)("div",{className:"h-3 w-20 rounded-full bg-[#FFE36E]"}),(0,t.jsx)("h3",{className:"mt-8 text-[26px] font-bold leading-tight text-[#13A8DF] sm:text-[30px] md:text-[32px]",children:e.title}),(0,t.jsx)("p",{className:"mt-4 text-[17px] font-medium leading-[1.5] text-[#071B63]/75 sm:text-[18px]",children:e.description})]},e.title))})]})})}e.s(["default",0,function(){let e=(0,a.useAdminDisplayContent)("aplus-admin-kids-zone-content","aplus-published-kids-zone-content",[]),n=e.filter(e=>e.active),l=(e,t)=>n.find(s=>s.id===e||s.section===t),r=e.length>0,d=l("hero","Hero"),c=l("birthdays","Birthday"),m=l("kids-champ","Kids Champ"),h=l("events","Events");return(0,t.jsxs)("main",{className:"bg-white text-black",children:[(0,t.jsx)(s.default,{}),!r||d?(0,t.jsx)(o,{content:d}):null,(0,t.jsx)("div",{className:"relative z-30 bg-white",children:(0,t.jsx)(i.default,{})}),!r||c?(0,t.jsx)(x,{content:c}):null,!r||m?(0,t.jsx)(p,{content:m}):null,!r||h?(0,t.jsx)(u,{content:h}):null]})}],86747)}]);