USE [ticket_system]
GO

/****** Object:  Table [dbo].[notes_master]    Script Date: 11/10/2025 10:55:16 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[notes_master](
	[note_id] [int] IDENTITY(1,1) NOT NULL,
	[note] [nvarchar](max) NOT NULL,
	[created_by] [nvarchar](100) NOT NULL,
	[created_at] [datetime] NULL,
	[ticket_id] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[note_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[notes_master] ADD  DEFAULT (getdate()) FOR [created_at]
GO


