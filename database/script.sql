CREATE TABLE public.utilisateur (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  email character varying NOT NULL,
  password character varying,
  create_date timestamp with time zone DEFAULT now(),
  country character varying,
  address character varying,
  image character varying,
  newsletter boolean,
  isadmin boolean DEFAULT false,
  birth_date date,
  name character varying,
  first_name character varying,
  isdelivery boolean DEFAULT false,
  CONSTRAINT utilisateur_pkey PRIMARY KEY (id)
);
CREATE TABLE public.product (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  create_date timestamp with time zone NOT NULL DEFAULT now(),
  stock bigint DEFAULT '0'::bigint,
  name character varying,
  price bigint,
  description text,
  CONSTRAINT product_pkey PRIMARY KEY (id)
);
CREATE TABLE public.commande (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  create_date timestamp with time zone NOT NULL DEFAULT now(),
  price numeric,
  id_user bigint,
  id_delivery bigint,
  CONSTRAINT commande_pkey PRIMARY KEY (id),
  CONSTRAINT commande_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.utilisateur(id)
);
CREATE TABLE public.ligne_commande (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  create_date timestamp with time zone NOT NULL DEFAULT now(),
  id_commande bigint,
  id_product bigint,
  quantity integer,
  price_unit integer,
  CONSTRAINT ligne_commande_pkey PRIMARY KEY (id),
  CONSTRAINT ligne_commande_id_commande_fkey FOREIGN KEY (id_commande) REFERENCES public.commande(id),
  CONSTRAINT ligne_commande_id_product_fkey FOREIGN KEY (id_product) REFERENCES public.product(id)
);
CREATE TABLE public.facture (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  create_date timestamp with time zone NOT NULL DEFAULT now(),
  id_commande bigint,
  id_user bigint,
  total_price integer,
  facture_date timestamp without time zone,
  CONSTRAINT facture_pkey PRIMARY KEY (id),
  CONSTRAINT facture_id_commande_fkey FOREIGN KEY (id_commande) REFERENCES public.commande(id),
  CONSTRAINT facture_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.utilisateur(id)
);
CREATE TABLE public.delivery (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_commande bigint NOT NULL,
  id_delivery bigint,
  date_delivery timestamp with time zone,
  delivery_address character varying,
  CONSTRAINT delivery_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_id_commande_fkey FOREIGN KEY (id_commande) REFERENCES public.commande(id),
  CONSTRAINT delivery_id_delivery_fkey FOREIGN KEY (id_delivery) REFERENCES public.utilisateur(id)
);