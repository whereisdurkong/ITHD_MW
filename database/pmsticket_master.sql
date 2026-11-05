USE [ticket_system]
GO

/****** Object:  Table [dbo].[pmsticket_master]    Script Date: 11/10/2025 10:59:18 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[pmsticket_master](
	[pmsticket_id] [int] IDENTITY(1,1) NOT NULL,
	[tag_id] [nvarchar](100) NULL,
	[pms_status] [nvarchar](255) NULL,
	[description] [nvarchar](max) NULL,
	[assigned_to] [nvarchar](255) NULL,
	[assigned_location] [nvarchar](255) NULL,
	[pmsticket_for] [varchar](255) NULL,
	[returned_at] [datetime] NULL,
	[is_notified] [bit] NULL,
	[is_notifiedhd] [bit] NULL,
	[is_active] [bit] NULL,
	[is_reviewed] [bit] NULL,
	[is_locked] [nvarchar](100) NULL,
	[locked_at] [datetime] NULL,
	[locked_by] [nvarchar](255) NULL,
	[created_at] [datetime] NULL,
	[created_by] [nvarchar](255) NULL,
	[updated_by] [nvarchar](255) NULL,
	[updated_at] [datetime] NULL,
	[resolved_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[pmsticket_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO


