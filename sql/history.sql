-- Table: public.history

-- DROP TABLE public.history;

CREATE TABLE public.history
(
    id character varying COLLATE pg_catalog."default",
    field character varying(50) COLLATE pg_catalog."default",
    newvalue character varying COLLATE pg_catalog."default",
    modificationdate date
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.history
    OWNER to postgres;
