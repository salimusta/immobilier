-- Table: public.immobilier

-- DROP TABLE public.immobilier;

CREATE TABLE public.immobilier
(
    id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    title character varying COLLATE pg_catalog."default" NOT NULL,
    category character varying(50) COLLATE pg_catalog."default",
    link character varying(150) COLLATE pg_catalog."default",
    image character varying(300) COLLATE pg_catalog."default",
    urgent boolean,
    price integer,
    seller character varying(50) COLLATE pg_catalog."default",
    rent integer,
    zip character varying(7) COLLATE pg_catalog."default",
    city character varying(100) COLLATE pg_catalog."default",
    type character varying(50) COLLATE pg_catalog."default",
    rooms integer,
    furnished boolean,
    surface character varying(1000) COLLATE pg_catalog."default",
    location character varying(100) COLLATE pg_catalog."default",
    ges character varying(5) COLLATE pg_catalog."default",
    classe character varying(100) COLLATE pg_catalog."default",
    description character varying(2000) COLLATE pg_catalog."default",
    date character varying(50) COLLATE pg_catalog."default",
    CONSTRAINT immobilier_pkey PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.immobilier
    OWNER to postgres;
