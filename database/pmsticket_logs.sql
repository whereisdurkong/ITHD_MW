USE [ticket_system]
GO

/****** Object:  Table [dbo].[pmsticket_logs]    Script Date: 11/10/2025 10:58:51 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[pmsticket_logs](
	[id_master] [int] IDENTITY(1,1) NOT NULL,
	[changes_made] [nvarchar](max) NULL,
	[tag_id] [nvarchar](100) NULL,
	[created_at] [nvarchar](100) NULL,
	[created_by] [nvarchar](255) NULL,
	[pmsticket_id] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_master] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

