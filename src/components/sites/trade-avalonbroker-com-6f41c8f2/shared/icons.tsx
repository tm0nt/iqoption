import type { SVGProps } from "react";

/**
 * Icons extracted from trade.avalonbroker.com/en/login.
 *
 * The original ships a hidden <svg> sprite in <body> and references its symbols with
 * <use href="#id">. The flag and Google marks rely on cross-referenced <clipPath>,
 * <linearGradient> and <path> defs, so the sprite is reproduced verbatim rather than
 * flattened into standalone components. `AvalonIconSprite` must be rendered once per page.
 */

const SPRITE_MARKUP = `<symbol viewBox="0 0 88 88" id="icon_general_form-recovery"><g fill="none"><path d="M88 44c0 24.3-19.699 44-44 44C19.7 88 0 68.3 0 44S19.7 0 44 0c24.301 0 44 19.7 44 44z" fill="#F4F4F9"></path><circle fill="#fff" cx="46" cy="44" r="25"></circle><path d="M61.005 24.113l3.075 2.49-.254-4.762a1.024 1.024 0 0 1 1.664-.845c.227.184.364.452.378.745l.316 6.046a2.138 2.138 0 0 1-1.794 2.216l-5.84.775a1.023 1.023 0 0 1-.328-2.018l4.571-.569-3.075-2.49c-10.247-8.298-25.334-6.713-33.633 3.535-8.298 10.248-6.713 25.334 3.535 33.633 10.248 8.298 25.334 6.713 33.633-3.535a1.023 1.023 0 0 1 1.589 1.287c-9.007 11.123-25.385 12.844-36.508 3.837-11.123-9.007-12.844-25.385-3.837-36.508 9.007-11.123 25.385-12.844 36.508-3.837zm-16.62 4.637c4.602 0 8.363 3.677 8.5 8.248l.004.255v4.21l.644.106.852.154a2.871 2.871 0 0 1 2.332 2.641l.006.179V55.48a2.87 2.87 0 0 1-2.338 2.82c-3.342.632-6.736.95-10.137.951A54.661 54.661 0 0 1 34.11 58.3a2.871 2.871 0 0 1-2.332-2.641l-.006-.179V44.542a2.873 2.873 0 0 1 2.338-2.82l.852-.154.643-.106v-4.21c0-4.517 3.543-8.224 7.995-8.487l.253-.011.255-.004h.278zm-9.901 14.961a.85.85 0 0 0-.683.722l-.007.109V55.48c0 .407.29.756.689.831 3.219.608 6.487.915 9.763.916a52.582 52.582 0 0 0 9.762-.916.848.848 0 0 0 .683-.722l.007-.109V44.542a.848.848 0 0 0-.689-.832 52.495 52.495 0 0 0-19.525 0zm9.901-12.937h-.278a6.488 6.488 0 0 0-6.475 6.247l-.004.232-.001 3.924.65-.076.704-.072.001-3.771a5.135 5.135 0 0 1 4.913-5.125l.217-.005h.269a5.136 5.136 0 0 1 5.125 4.914l.005.217-.001 3.771.706.073.648.076.001-3.924a6.488 6.488 0 0 0-6.247-6.475l-.232-.004zm-.005 3.377h-.268a3.11 3.11 0 0 0-3.101 2.931l-.005.176-.001 3.613.61-.035a51.277 51.277 0 0 1 1.754-.057l.877-.007c.877.001 1.754.022 2.63.065l.61.034.001-3.613a3.111 3.111 0 0 0-2.931-3.102l-.176-.005z" fill="#25258E"></path><path d="M44.5 44.5a3.5 3.5 0 0 0-1.019 6.847v2.86a1.019 1.019 0 1 0 2.038 0v-2.86A3.5 3.5 0 0 0 44.5 44.5zm0 4.961a1.463 1.463 0 1 1 .001-2.925 1.463 1.463 0 0 1-.001 2.925z" fill="#FF5722"></path></g></symbol><clipPath id="en-a"> <path fill-opacity=".67" d="M250 0h500v500H250z"></path></clipPath><symbol viewBox="0 0 512 512" id="icon_langmenu_en"><g clip-path="url(#en-a)" transform="translate(-256) scale(1.024)"><g stroke-width="1pt"><path fill="#006" d="M0 0h1000.02v500.01H0z"></path><path d="M0 0v55.903l888.218 444.11h111.802V444.11L111.802.003H0zm1000.02 0v55.9L111.802 500.01H0v-55.9L888.218 0h111.802z" fill="#fff"></path><path d="M416.675 0v500.01h166.67V0h-166.67zM0 166.67v166.67h1000.02V166.67H0z" fill="#fff"></path><path d="M0 200.004v100.002h1000.02V200.004H0zM450.01 0v500.01h100V0h-100zM0 500.01l333.34-166.67h74.535L74.535 500.01H0zM0 0l333.34 166.67h-74.535L0 37.27V0zm592.145 166.67L925.485 0h74.535L666.68 166.67h-74.535zm407.875 333.34L666.68 333.34h74.535l258.805 129.403v37.267z" fill="#c00"></path></g></g></symbol><linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="es-a"> <stop stop-color="#D80027" offset="0%"></stop><stop stop-color="#D80027" offset="75.664%"></stop><stop stop-color="#FFDA44" offset="75.98%"></stop><stop stop-color="#FFDA44" offset="100%"></stop></linearGradient><linearGradient x1="50%" y1="100%" x2="50%" y2="0%" id="es-b"> <stop stop-color="#D80027" offset="0%"></stop><stop stop-color="#D80027" offset="75.664%"></stop><stop stop-color="#FFDA44" offset="75.98%"></stop><stop stop-color="#FFDA44" offset="100%"></stop></linearGradient><symbol viewBox="0 0 32 32" id="icon_langmenu_es"><g fill="none" fill-rule="evenodd"><path d="M31.005 10.435a15.909 15.909 0 0 0-1.518-3.045 16.079 16.079 0 0 0-2.447-2.97A15.944 15.944 0 0 0 16 0C11.719 0 7.83 1.681 4.96 4.42a16.079 16.079 0 0 0-3.305 4.486 15.909 15.909 0 0 0-.66 1.529h30.01z" fill="url(#es-a)"></path><path d="M0 16c0 1.957.352 3.832.995 5.565L16 22.956l15.005-1.39C31.648 19.831 32 17.956 32 16c0-1.957-.352-3.832-.995-5.565L16 9.043.995 10.435A15.966 15.966 0 0 0 0 16z" fill="#FFDA44"></path><path d="M.995 21.565C3.255 27.658 9.121 32 16 32c6.88 0 12.744-4.342 15.005-10.435H.995z" fill="url(#es-b)"></path><g transform="translate(10 10)"><path d="M11.5 6l.492-2.544c.045-.234-.11-.456-.319-.456h-.346c-.21 0-.364.222-.32.456L11.5 6z" fill="#AD1519"></path><path fill="#E6E6E6" d="M11 5h1v6h-1z"></path><path fill="#FAB446" d="M11 4h2v1h-2z"></path><g fill="#AD1519"><path d="M9.523 6.143h3.44v.693h-3.44zM12.962 8.917L10.9 8.223V7.53l2.063.693zM1.613 6.143l.583-2.646a.39.39 0 0 0-.378-.475h-.41a.39.39 0 0 0-.379.475l.584 2.646z"></path></g><path d="M3.7 4c-.387 0-.7.326-.7.727v4.728C3 10.338 3.794 12 6.5 12S10 10.338 10 9.455V4.727A.714.714 0 0 0 9.3 4H3.7z" fill="#E6E6E6"></path><g fill="#AD1519"><path d="M6.467 7.464H3.072v-2.74c0-.377.304-.684.679-.684h2.716v3.424zM6.467 7.464h3.395v1.711c0 .946-.76 1.712-1.698 1.712a1.705 1.705 0 0 1-1.697-1.712V7.464z"></path></g><path d="M3 8h3v1.5a1.5 1.5 0 1 1-3 0V8z" fill="#FAB446"></path><g fill="#AD1519"><path d="M5.946 11.315V8.054h-.63v3.596c.234-.055.446-.174.63-.335zM4.685 11.65V8.054h-.63v3.261c.183.16.395.28.63.335z"></path></g><path fill="#FFB441" d="M4 6h2v1H4z"></path><g fill="#FAB446"><path d="M4.054 5.031h1.892v.803H4.054z"></path><path d="M4.37 5.508h1.26v1.454H4.37z"></path></g><path fill="#E6E6E6" d="M1 5h1v6H1z"></path><g fill="#FAB446"><path d="M.044 10.203h1.892v.684H.044zM.044 4.04h1.892v1H.044z"></path></g><path fill="#5064AA" d="M0 11h3v1H0z"></path><path fill="#FAB446" d="M11 10h2v1h-2z"></path><path fill="#5064AA" d="M10 11h3v1h-3z"></path><path fill="#FAB446" d="M5 3h4v1H5z"></path><path fill="#FFB441" d="M6 1h1v2H6z"></path><g fill="#E6E6E6"><path d="M5.603 1.977c-.608 0-1.103-.428-1.103-.954S4.995.07 5.603.07c.609 0 1.104.427 1.104.953s-.495.954-1.104.954zm0-1.272c-.203 0-.367.143-.367.318 0 .176.164.318.367.318.203 0 .368-.142.368-.318 0-.175-.165-.318-.368-.318z"></path><path d="M7.075 1.977c-.609 0-1.104-.428-1.104-.954S6.466.07 7.075.07c.608 0 1.103.427 1.103.953s-.495.954-1.103.954zm0-1.272c-.203 0-.368.143-.368.318 0 .176.165.318.368.318.203 0 .368-.142.368-.318 0-.175-.165-.318-.368-.318z"></path><path d="M8.546 2.613c-.609 0-1.103-.428-1.103-.954S7.938.705 8.546.705s1.103.428 1.103.954-.495.954-1.103.954zm0-1.272c-.203 0-.368.143-.368.318 0 .175.165.318.368.318.203 0 .368-.143.368-.318 0-.175-.165-.318-.368-.318zM4.132 2.613c-.608 0-1.103-.428-1.103-.954S3.524.705 4.132.705c.609 0 1.104.428 1.104.954s-.495.954-1.104.954zm0-1.272c-.203 0-.368.143-.368.318 0 .175.165.318.368.318.203 0 .368-.143.368-.318 0-.175-.165-.318-.368-.318z"></path></g><path d="M8.333 8.667V9a.334.334 0 0 1-.666 0v-.333h.666zM9 8H7v1a1.001 1.001 0 0 0 2 0V8z" fill="#FAB446"></path><path d="M8.5 7c-.276 0-.5-.299-.5-.667v-.666C8 5.299 8.224 5 8.5 5s.5.299.5.667v.666C9 6.701 8.776 7 8.5 7z" fill="#FFA0D2"></path><circle fill="#5064AA" cx="7" cy="8" r="1"></circle><path fill="#FAB446" d="M6 0h1v2H6z"></path><path d="M4.625 3L4 2.333l.366-.39A2.925 2.925 0 0 1 6.5 1c.8 0 1.568.34 2.134.943l.366.39L8.375 3h-3.75z" fill="#AD1519"></path><g transform="translate(5 2)" fill="#FFD250"><ellipse cx="2.006" cy=".486" rx="1" ry="1"></ellipse><ellipse cx=".47" cy=".486" rx="1" ry="1"></ellipse><ellipse cx="3.541" cy=".486" rx="1" ry="1"></ellipse></g><g fill="#AD1519"><path d="M.05 6h3.604v.636H.05zM.05 8.543l2.162-.636v-.635l-2.161.635z"></path></g></g></g></symbol><symbol viewBox="0 0 32 32" id="icon_langmenu_pt"><g fill="none" fill-rule="evenodd"><path d="M0 16c0 6.88 4.342 12.744 10.435 15.005L11.826 16 10.435.995C4.342 3.255 0 9.121 0 16z" fill="#6DA544"></path><path d="M32 16c0-8.837-7.163-16-16-16-1.957 0-3.832.352-5.565.995v30.01c1.733.643 3.608.995 5.565.995 8.837 0 16-7.163 16-16z" fill="#D80027"></path><circle stroke="#FFDA44" cx="10.435" cy="16" r="5.065"></circle><g transform="translate(7.5 12.5)"><path d="M4.713 1.687v2.599c0 1.075-.788 1.949-1.755 1.949-.968 0-1.756-.874-1.756-1.949V1.687h3.51zM5.298.388H.618c-.324 0-.586.291-.586.65v3.248c0 1.794 1.31 3.248 2.926 3.248 1.615 0 2.925-1.454 2.925-3.248V1.038c0-.359-.262-.65-.585-.65z" fill="#D80027" fill-rule="nonzero"></path><path d="M4.713 1.687v2.599c0 1.075-.788 1.949-1.755 1.949-.968 0-1.756-.874-1.756-1.949V1.687h3.51" fill="#F5F5F5"></path><ellipse fill="#FFE15A" cx=".613" cy="1.038" rx="1" ry="1"></ellipse><ellipse fill="#FFE15A" cx="5.293" cy="1.038" rx="1" ry="1"></ellipse><ellipse fill="#FFE15A" cx=".613" cy="3.636" rx="1" ry="1"></ellipse><ellipse fill="#FFE15A" cx="5.293" cy="3.636" rx="1" ry="1"></ellipse><ellipse fill="#FFE15A" cx="2.953" cy="1.038" rx="1" ry="1"></ellipse><ellipse fill="#FFE15A" cx="4.709" cy="6.032" rx="1" ry="1"></ellipse><ellipse fill="#FFE15A" cx="1.231" cy="6.032" rx="1" ry="1"></ellipse><path d="M3.335 3.472v.56c0 .23-.17.419-.377.419-.209 0-.378-.188-.378-.42v-.56h.755M3.335 2.145v.56c0 .231-.17.42-.377.42-.209 0-.378-.189-.378-.42v-.56h.755M3.335 4.812v.56c0 .23-.17.419-.377.419-.209 0-.378-.189-.378-.42v-.56h.755M4.353 3.472v.56c0 .23-.17.419-.378.419s-.378-.188-.378-.42v-.56h.756M2.318 3.472v.56c0 .23-.17.419-.378.419-.209 0-.378-.188-.378-.42v-.56h.756" fill="#41479B"></path></g></g></symbol><path id="ic_google-a" d="M194.663 93.273h-13.826v5.795h7.958c-.742 3.682-3.844 5.796-7.958 5.796-4.856 0-8.767-3.955-8.767-8.864 0-4.91 3.911-8.864 8.767-8.864 2.09 0 3.98.75 5.463 1.978l4.316-4.364c-2.63-2.318-6.002-3.75-9.779-3.75C172.61 81 166 87.682 166 96s6.61 15 14.837 15c7.419 0 14.163-5.455 14.163-15 0-.886-.135-1.84-.337-2.727z"> </path><clipPath id="ic_google-b"> <use xlink:href="#ic_google-a"></use></clipPath><path id="ic_google-c" d="M164.65 104.867V87.14l11.465 8.864z"> </path><clipPath id="ic_google-d"> <use xlink:href="#ic_google-a"></use></clipPath><path id="ic_google-e" d="M164.65 87.14l11.465 8.864 4.721-4.16 16.186-2.659V79.64H164.65z"> </path><clipPath id="ic_google-f"> <use xlink:href="#ic_google-a"></use></clipPath><path id="ic_google-g" d="M164.65 104.867l20.233-15.682 5.327.682 6.812-10.227v32.727H164.65z"> </path><clipPath id="ic_google-h"> <use xlink:href="#ic_google-a"></use></clipPath><path id="ic_google-i" d="M197.025 112.367l-20.907-16.363-2.698-2.046 23.605-6.818z"> </path><symbol viewBox="0 0 29 30" id="icon_layout_ic_google"><g clip-path="url(#ic_google-b)" transform="translate(-166 -81)"><use fill="#fbbc05" xlink:href="#ic_google-c"></use></g><g clip-path="url(#ic_google-d)" transform="translate(-166 -81)"><use fill="#ea4335" xlink:href="#ic_google-e"></use></g><g clip-path="url(#ic_google-f)" transform="translate(-166 -81)"><use fill="#34a853" xlink:href="#ic_google-g"></use></g><g clip-path="url(#ic_google-h)" transform="translate(-166 -81)"><use fill="#4285f4" xlink:href="#ic_google-i"></use></g></symbol>`;

/** Hidden sprite holding every symbol referenced by the icons below. */
export function AvalonIconSprite() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0 }}
      dangerouslySetInnerHTML={{ __html: SPRITE_MARKUP }}
    />
  );
}

type IconProps = SVGProps<SVGSVGElement>;

function SpriteIcon({ id, ...props }: IconProps & { id: string }) {
  return (
    <svg aria-hidden="true" focusable="false" {...props}>
      <use href={`#${id}`} />
    </svg>
  );
}

/** 18x18 flag shown in the language trigger and the "English" menu item. */
export function FlagEnIcon(props: IconProps) {
  return <SpriteIcon id="icon_langmenu_en" width={18} height={18} {...props} />;
}

/** 18x18 flag for the "Espanol" menu item. */
export function FlagEsIcon(props: IconProps) {
  return <SpriteIcon id="icon_langmenu_es" width={18} height={18} {...props} />;
}

/** 18x18 flag for the "Portugues" menu item. */
export function FlagPtIcon(props: IconProps) {
  return <SpriteIcon id="icon_langmenu_pt" width={18} height={18} {...props} />;
}

/** 26x27 multicolour Google mark inside the social login button. */
export function GoogleIcon(props: IconProps) {
  return <SpriteIcon id="icon_layout_ic_google" width={26} height={27} {...props} />;
}

/**
 * 21x20 "enter" arrow that replaces the Sign Up label at <=839px.
 * Inlined rather than spritesheeted because the original inlines it too.
 */
export function LoginArrowIcon(props: IconProps) {
  return (
    <svg
      width={21}
      height={20}
      viewBox="0 0 21 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <g fill="currentColor">
        <path d="M0,10.0479728 C0,10.4361105 0.315746374,10.7507063 0.705303589,10.7507063 L14.1388766,10.7507063 L11.5185918,13.3573572 C11.2438514,13.6310964 11.2438514,14.0764333 11.5185918,14.3501725 C11.6539116,14.4849992 11.8343381,14.5544554 12.0147646,14.5544554 C12.1951911,14.5544554 12.3756176,14.4849992 12.5109375,14.3501725 L16.3285982,10.5464233 C16.6033386,10.2726841 16.6033386,9.82734721 16.3285982,9.55360801 L12.5109375,5.74985885 C12.2361971,5.47611966 11.7892315,5.47611966 11.5144911,5.74985885 C11.2397508,6.02359805 11.2397508,6.46893496 11.5144911,6.74267415 L14.1306754,9.34932502 L0.705303589,9.34932502 C0.315746374,9.34932502 0,9.65983516 0,10.0479728 Z" />
        <path d="M16.1964894,20 C18.5150337,20 20.3960396,18.1156755 20.3960396,15.7980789 L20.3960396,4.20192111 C20.3960396,1.88432455 18.5109445,0 16.1964894,0 L4.5955898,0 C2.27704553,0 0.396039604,1.88432455 0.396039604,4.20192111 L0.396039604,6.58491723 C0.396039604,6.97322706 0.71090364,7.28387492 1.09528311,7.28387492 C1.48375173,7.28387492 1.79861576,6.96913959 1.79861576,6.58491723 L1.79861576,4.20192111 C1.79861576,2.66094421 3.05398276,1.40200286 4.5955898,1.40200286 L16.1964894,1.40200286 C17.7380964,1.40200286 18.9934634,2.65685673 18.9934634,4.20192111 L18.9934634,15.7980789 C18.9934634,17.3390558 17.7380964,18.5979971 16.1964894,18.5979971 L4.5955898,18.5979971 C3.05398276,18.5979971 1.79861576,17.3431433 1.79861576,15.7980789 L1.79861576,13.4436951 C1.79861576,13.0553852 1.48375173,12.7406499 1.09528311,12.7406499 C0.706814497,12.7406499 0.396039604,13.0553852 0.396039604,13.4436951 L0.396039604,15.7980789 C0.396039604,18.1156755 2.28113468,20 4.5955898,20 L16.1964894,20 L16.1964894,20 Z" />
      </g>
    </svg>
  );
}

/** 88x88 lock-and-arrow illustration above the password-recovery form. */
export function PasswordRecoveryIcon(props: IconProps) {
  return <SpriteIcon id="icon_general_form-recovery" width={88} height={88} {...props} />;
}

/**
 * The select carets are pure CSS triangles on the live site
 * (border-width: 5px 5px 0; 10x5 box), reproduced here as a 10x5 shape.
 */
export function SelectCaret({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        width: 0,
        height: 0,
        borderLeft: "5px solid transparent",
        borderRight: "5px solid transparent",
        borderTop: "5px solid currentColor",
      }}
    />
  );
}
