USE [ticket_system]
GO

/****** Object:  Table [dbo].[ticket_logs]    Script Date: 11/10/2025 11:00:07 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[ticket_logs](
	[id_master] [int] IDENTITY(1,1) NOT NULL,
	[ticket_id] [int] NOT NULL,
	[ticket_status] [varchar](255) NULL,
	[ticket_subject] [varchar](255) NULL,
	[ticket_urgencyLevel] [varchar](255) NULL,
	[ticket_category] [varchar](255) NULL,
	[created_by] [varchar](255) NULL,
	[time_date] [datetime] NULL,
	[changes_made] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_master] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[ticket_logs] ADD  DEFAULT (getdate()) FOR [time_date]
GO


