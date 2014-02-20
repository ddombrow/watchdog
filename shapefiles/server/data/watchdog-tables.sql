DROP TABLE IF EXISTS crimes;
CREATE TABLE crimes(
	id serial,
	caseNo bigint NOT NULL,
	typeCode int NOT NULL,
	description text NOT NULL,
	link text NOT NULL,
	tstamp timestamptz NOT NULL,
	lat float8 NOT NULL,
	lon float8 NOT NULL,
	geom geometry NOT NULL,
	descVec tsvector NOT NULL 
);

DROP TABLE IF EXISTS crimeType;
CREATE TABLE crimeType(
	code int NOT NULL,
	typeName varchar(255) NOT NULL
);
